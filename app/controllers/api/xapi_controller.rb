class Api::XapiController < ApplicationController

  # before_action :validate_token

  # load_and_authorize_resource

  skip_before_action :verify_authenticity_token

  def index
    require "net/https"
    require "uri"

	# Need to have passed in via POST params:
		# quiz id (url?)
		# question id
		# action
		# result 

	statement = %Q(
	{
	    "actor": {
		"name": "#{current_user.name}",
		"mbox": "mailto:#{current_user.email}"
	    },
	    "verb": {
		 "id": "http://adlnet.gov/expapi/verbs/#{params['verb']}",
		 "display": {"en-US": "#{params['verb']}"}
	    },
	    "object": {
		 "id": "#{params['src_url']}",
		 "definition": {
		     "name": { "en-US": "Assessment #{params['assessment_id']}" },
		     "description": { "en-US": "This is the description." }
		 }
	    },
	    "result": {
		    "score": {
			    "scaled": #{params['score']}
		    }
	    }
	}
	)

    uri = URI.parse("https://ec2-52-26-250-81.us-west-2.compute.amazonaws.com/lrs/data/xAPI/statements")

    http = Net::HTTP.new(uri.host,uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE

    request = Net::HTTP::Post.new(uri.request_uri)
    request["X-Experience-API-Version"] = "1.0.0"
    request["Content-Type"] = "application/json"
    request.body = statement
    request.basic_auth("2c74146ac94ceb9d7807fa3080e49bb98f53b1c9","4bd0bf1a080be1a1919e11398edbfcb6c20b692e")
    response = http.request(request)
    
    # render text: '<b>Test xapi request: ' + params.inspect + '</b><br/>Statement: ' + statement + '<br/>Code: ' + response.code + '<br/>Response: ' + response.body + '<br />'
    render text: '<b>Test UNSENT xapi request: ' + params.inspect + '</b><br/>User info: ' + current_user.inspect + session.inspect + '<br/>Statement: ' + statement + '<br/>Code: ' + response.code + '<br/>Response: ' + response.body + '<br />'
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
