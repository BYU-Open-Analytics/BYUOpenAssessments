admin = CreateAdminService.new.call
puts 'CREATED ADMIN USER: ' << admin.email

# Setup default accounts
canvas_uri = ENV["APP_DEFAULT_CANVAS_URL"] || 'https://canvas.instructure.com'

if Rails.env.production?
  accounts = [{
    code: 'byuopenassessments',
    name: 'BYU Open Assessments',
    domain: 'https://ec2-52-26-250-81.us-west-2.compute.amazonaws.com',
    lti_key: 'byuopenassessments',
    lti_secret: 'd9d728a27969baea23d57811f83efa9d6a7dbc98bff1b4c0ba8ae6de35a95c5fdce88c69361526a1e0841842d632f27e430457e8b1592b39fa1b5db8039c1f9b',
    canvas_uri: 'https://canvas.instructure.com'
  },{
	code: 'isopenassessments',
	name: 'BYU Independent Study',
	domain: 'https://ec2-52-26-250-81.us-west-2.compute.amazonaws.com',
	lti_key: 'isopenassessments',
	lti_secret:'94e54eb3d075a659e44050587fe6c430f30bf91019df91e9efba2d1c8438b0eeffab9f3d2d37a18921099f628a53e6de5c88e976625f45421558720ca57b4f4f',
	canvas_uri: 'https://canvas.instructure.com'
  }]
  canvas_uri ||= 'https://canvas.instructure.com'
else
  accounts = [{
    code: 'byuopenassessmentsdev',
    name: 'BYU Open Assessments Dev',
    domain: 'http://quizapp.site:8080',
    lti_key: 'byuopenassessments',
    lti_secret: 'd9d728a27969baea23d57811f83efa9d6a7dbc98bff1b4c0ba8ae6de35a95c5fdce88c69361526a1e0841842d632f27e430457e8b1592b39fa1b5db8039c1f9b',
    canvas_uri: 'https://canvas.instructure.com'
  }]
  canvas_uri ||= 'https://atomicjolt.instructure.com'
end

puts accounts

# accounts = [{
  # code: ENV["APP_SUBDOMAIN"],
  # name: Rails.application.secrets.application_name,
  # domain: Rails.application.secrets.application_url,
  # lti_key: ENV["APP_SUBDOMAIN"],
  # canvas_uri: canvas_uri
# }]

# puts accounts

# Setup accounts
accounts.each do |account|
  if a = Account.find_by(code: account[:code])
    a.update_attributes!(account)
  else
    a = Account.create!(account)
  end
end

account = Account.find_by(code: ENV["APP_SUBDOMAIN"])

# Load QTI files
Dir.glob("db/qti/*") do |f|
  puts "****************************************************************"
  puts "Adding QTI file #{f}"
  puts "****************************************************************"
  xml_file = File.open(f, "rb").read
  if assessment = Assessment.find_by(title: f)
    assessment.title = f
    assessment.xml_file = xml_file
    assessment.user = admin
    assessment.account_id = account.id
    assessment.kind = "formative"
    assessment.save!
  else
    Assessment.create!(
      title: f,
      xml_file: xml_file,
      user: admin,
      kind: "formative",
      account_id: account.id
    )
  end
end

if assessment = Assessment.find_by(title: 'drupal.xml')
  assessment.recommended_height = 960
  assessment.save!
end


