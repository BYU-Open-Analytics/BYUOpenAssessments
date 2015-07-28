class Api::XapiController < ApplicationController

  # before_action :validate_token

  # load_and_authorize_resource

  skip_before_action :verify_authenticity_token

  def index
  
    processed_statements = process_statement_queue(params["statements"])
    
    uri = URI.parse("https://ec2-52-26-250-81.us-west-2.compute.amazonaws.com/lrs/data/xAPI/statements")
    # uri = URI.parse("http://validate.jsontest.com")

    http = Net::HTTP.new(uri.host,uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE

    request = Net::HTTP::Post.new(uri.request_uri)
    request["X-Experience-API-Version"] = "1.0.0"
    request["Content-Type"] = "application/json"
    request.body = processed_statements.to_json
    request.basic_auth("2c74146ac94ceb9d7807fa3080e49bb98f53b1c9","4bd0bf1a080be1a1919e11398edbfcb6c20b692e")
    response = http.request(request)
    
    # render text: '<b>Test xapi request: ' + params.inspect + '</b><br/>Statement: ' + statement + '<br/>Code: ' + response.code + '<br/>Response: ' + response.body + '<br />'
    # render text: '<b>Test UNSENT xapi request: ' + params.inspect + '</b><br/>User info: ' + current_user.inspect + session.inspect + '<br/>Statement: ' + statement.to_json + '<br/>Code: ' + response.code + '<br/>Response: ' + response.body + '<br />'
    render text: "Test UNSENT xapi statement: \n#{request.body}\n Response: " + response.body
    # respond_to do |format|
      # format.json { render json: @accounts }
    # end
  end

  def create
    if @account.save
      respond_to do |format|
        format.json { render json: @account }
      end
    else
     respond_to do |format|
        format.json { render json: @account.errors, status: :unprocessable_entity}
      end
    end
  end

  def update
    if @account.update_attributes(update_params)
      respond_to do |format|
        format.json { render json: @account }
      end
    else
     respond_to do |format|
        format.json { render json: @account.errors, status: :unprocessable_entity}
      end
    end
  end

  private

    # This function takes a list of statement infos passed from JS frontend, and returns a list of full xAPI statements
    def process_statement_queue(statement_list)
    	processed_statements = []
	statement_list.each do|statement|
		processed_statements.append(process_statement(statement))
	end
	return processed_statements
    end

    # This function takes statement info passed from JS frontend, and returns a full xAPI statement
    def process_statement(statement_params)
	    require "net/https"
	    require "uri"
	    require "time"

	    # Set up the componenents of our statement
	    actor = {}
	    verb = {}
	    verbName = ""
	    object = {}
	    context = {}
	    result = {}

	    verbAuthority = "http://adlnet.gov/expapi/verbs/"
	    extensionAuthority = "http://byuopenanalytics.byu.edu/expapi/extensions/"

		# TODO check for things that are required in post params, especially assessment id/url
		# TODO check if user id passed in matches one from rails session? to check if the statement post is authorized

	    # Depending on the statement type, fill our verb, object, context, and result as needed
	    case statement_params["statementName"]
	    when "assessmentLaunched"
		verbName = "launched"
		object = {
			"id"		=> statement_params["assessmentUrl"],
			"definition"	=> {"name" => {"en-US" => "Assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
		}
	    when "questionAnswered"
		verbName = "answered"
		object = {
			"id"		=> "#{statement_params["assessmentUrl"]}##{statement_params["questionId"]}",
			"definition"	=> {"name" => {"en-US" => "Question ##{statement_params["questionId"]} of assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities"	=> {"parent" => { "id" => statement_params["assessmentUrl"]} },
			"extensions"		=> {
				"#{extensionAuthority}answer_given"	=> statement_params["answerGiven"],
				"#{extensionAuthority}confidence_level"	=> statement_params["confidenceLevel"],
				"#{extensionAuthority}question_type"	=> statement_params["questionType"].sub(/_question/,""),
				"#{extensionAuthority}correct"		=> statement_params["correct"]
				}
		}
		result = {
			"completion"	=> (statement_params["answerGiven"] != ""),
			"success"	=> statement_params["correct"],
			"duration"	=> statement_params["duration"],
		}

	    when "questionAttempted"
		verbName = "attempted"
		object = {
			"id"		=> "#{statement_params["assessmentUrl"]}##{statement_params["questionId"]}",
			"definition"	=> {"name" => {"en-US" => "Question ##{statement_params["questionId"]} of assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities"	=> {"parent" => { "id" => statement_params["assessmentUrl"]} },
			"extensions"		=> {"#{extensionAuthority}navigation_method" => statement_params["navigationMethod"]}
		}

	    when "assessmentSuspended"
		verbName = "suspended"
		object = {
			"id"		=> "#{statement_params["assessmentUrl"]}##{statement_params["questionId"]}",
			"definition"	=> {"name" => {"en-US" => "Question ##{statement_params["questionId"]} of assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities"	=> {"parent" => { "id" => statement_params["assessmentUrl"]} },
		}

	    when "assessmentResumed"
		verbName = "resumed"
		object = {
			"id"		=> "#{statement_params["assessmentUrl"]}##{statement_params["questionId"]}",
			"definition"	=> {"name" => {"en-US" => "Question ##{statement_params["questionId"]} of assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities"	=> {"parent" => { "id" => statement_params["assessmentUrl"]} },
		}

	    when "assessmentCompleted"
		verbName = "completed"
		object = {
			"id"		=> statement_params["assessmentUrl"],
			"definition"	=> {"name" => {"en-US" => "Assessment #{statement_params["assessmentId"]}"} }
		}
		context = {
			"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
		}
		# TODO implement completion, success, and raw/min/max (see xapi statement document)
		result = {
			"completion"	=> (statement_params["questionsAnswered"] == statement_params["questionsTotal"]),
			"success"	=> (statement_params["scaledScore"] > 0.5),
			"duration"	=> statement_params["duration"],
			"score"		=> {
						"scaled" => statement_params["scaledScore"],
						"raw"	 => statement_params["questionsCorrect"],
						"min"	 => 0,
						"max"	 => statement_params["questionsTotal"]
					   }
		}

	    else

	    end

	    # The actor will be the same for all our statement types
	    actor["name"] = current_user.name
	    actor["mbox"] = "mailto:#{current_user.email}"
	    actor["objectType"] = "Agent"

	    verb["id"] = verbAuthority + verbName
	    verb["display"] = {"en-US"=>verbName.capitalize}

	    # Include timestamp in all statements
	    timestamp = statement_params["timestamp"] || Time.now.utc.iso8601

	    statement = {
		    "actor"	=> actor,
		    "verb"	=> verb,
		    "object"	=> object,
		    "context"	=> context,
		    "result"	=> result,
		    "timestamp" => timestamp
	    }
	    return statement
    end

    def create_params
      params.require(:account).permit(:name, :domain, :canvas_uri, :code, :default_style)
    end

    def update_params
      params.require(:account).permit(:name, :domain, :canvas_uri, :code, :default_style)
    end

end
