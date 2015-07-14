module ApplicationHelper

  def canvas_url
    session[:canvas_url] || Rails.application.secrets.canvas_url
  end
  
  def available_styles 
    [
      ['oea', ''], 
      ['bw', 'bw'], 
      ['ocw', 'ocw']
    ]
  end

  def application_base_url
    File.join(request.base_url, "/")
  end

  def jwt_token
    return unless signed_in?
    AuthToken.issue_token({ user_id: current_user.id })
  end

end
