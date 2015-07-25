class Api::XapiController < ApplicationController

  # before_action :validate_token

  # load_and_authorize_resource

  skip_before_action :verify_authenticity_token

  def index
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

    # Valid statementName values: assessmentStarted, questionAnswered, questionAttempted, assessmentSuspsended, assessmentResumed, assessmentCompleted 
    # Depending on the statement type, fill our verb, object, context, and result as needed
    case params["statementName"]
    when "assessmentStarted"
	verbName = "attempted"
	object = {
		"id"		=> params["assessmentUrl"],
		"definition"	=> {"name" => {"en-US" => "Assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
	}
    when "questionAnswered"
	verbName = "answered"
	object = {
		"id"		=> "#{params["assessmentUrl"]}##{params["questionId"]}",
		"definition"	=> {"name" => {"en-US" => "Question ##{params["questionId"]} of assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities"	=> {"parent" => { "id" => params["assessmentUrl"]} },
		"extensions"		=> {
			"#{extensionAuthority}answer_given"	=> params["answerGiven"],
			"#{extensionAuthority}confidence_level"	=> params["confidenceLevel"],
			"#{extensionAuthority}question_type"	=> params["questionType"].sub(/_question/,""),
			"#{extensionAuthority}correct"		=> params["correct"]
			}
	}
	result = {
		"completion"	=> (params["answerGiven"] != ""),
		"success"	=> params["correct"],
		"duration"	=> params["duration"],
	}

    when "questionAttempted"
	verbName = "attempted"
	object = {
		"id"		=> "#{params["assessmentUrl"]}##{params["questionId"]}",
		"definition"	=> {"name" => {"en-US" => "Question ##{params["questionId"]} of assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities"	=> {"parent" => { "id" => params["assessmentUrl"]} },
		"extensions"		=> {"#{extensionAuthority}navigation_method" => params["navigationMethod"]}
	}

    when "assessmentSuspended"
	verbName = "suspended"
        # TODO change this if we want the object to be the particular question of the assessment
	object = {
		"id"		=> params["assessmentUrl"],
		"definition"	=> {"name" => {"en-US" => "Assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
	}

    when "assessmentResumed"
	verbName = "resumed"
        # TODO change this if we want the object to be the particular question of the assessment
	object = {
		"id"		=> params["assessmentUrl"],
		"definition"	=> {"name" => {"en-US" => "Assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
	}

    when "assessmentCompleted"
	verbName = "completed"
	object = {
		"id"		=> params["assessmentUrl"],
		"definition"	=> {"name" => {"en-US" => "Assessment #{params["assessmentId"]}"} }
	}
	context = {
		"contextActivities" => {"parent" => {"id" => "http://example.com/course_uri_here"} }
	}
	# TODO implement completion, success, and raw/min/max (see xapi statement document)
	result = {
		"completion"	=> (params["questionsAnswered"] == params["questionsTotal"]),
		"success"	=> (params["scaledScore"] > 0.5),
		"duration"	=> params["duration"],
		"score"		=> {
					"scaled" => params["scaledScore"],
					"raw"	 => params["questionsCorrect"],
					"min"	 => 0,
					"max"	 => params["questionsTotal"]
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
    timestamp = params["timestamp"] || Time.now.utc.iso8601

    statement = {
	    "actor"	=> actor,
	    "verb"	=> verb,
	    "object"	=> object,
	    "context"	=> context,
	    "result"	=> result,
	    "timestamp" => timestamp
    }

# 	statement = %Q(
# 	{
# 	    "actor": {
# 		"name": "#{current_user.name}",
# 		"mbox": "mailto:#{current_user.email}"
# 	    },
# 	    "verb": {
# 		 "id": "http://adlnet.gov/expapi/verbs/#{params['verb']}",
# 		 "display": {"en-US": "#{params['verb']}"}
# 	    },
# 	    "object": {
# 		 "id": "#{params['srcUrl']}",
# 		 "definition": {
# 		     "name": { "en-US": "Assessment #{params['assessmentId']}" },
# 		     "description": { "en-US": "This is the description." }
# 		 }
# 	    },
# 	    "result": {
# 		    "score": {
# 			    "scaled": #{params['score']}
# 		    }
# 	    }
# 	}
# 	)
# 
    uri = URI.parse("https://ec2-52-26-250-81.us-west-2.compute.amazonaws.com/lrs/data/xAPI/statements")
    # uri = URI.parse("http://validate.jsontest.com")

    http = Net::HTTP.new(uri.host,uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE

    request = Net::HTTP::Post.new(uri.request_uri)
    request["X-Experience-API-Version"] = "1.0.0"
    request["Content-Type"] = "application/json"
    request.body = statement.to_json
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

    def create_params
      params.require(:account).permit(:name, :domain, :canvas_uri, :code, :default_style)
    end

    def update_params
      params.require(:account).permit(:name, :domain, :canvas_uri, :code, :default_style)
    end

end