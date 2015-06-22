admin = CreateAdminService.new.call
puts 'CREATED ADMIN USER: ' << admin.email

# Setup default accounts
if Rails.env.production?
  accounts = [{
    code: 'byuopenassessments',
    name: 'BYU Open Assessments',
    domain: 'http://www.openassessments.com',
    lti_key: 'byuopenassessments',
    lti_secret: '',
    canvas_uri: 'https://canvas.instructure.com'
  }]
else
  accounts = [{
    code: 'byuopenassessmentsdev',
    name: 'BYU Open Assessments Dev',
    domain: 'http://openassessments.ngrok.com',
    lti_key: 'byuopenassessments',
    lti_secret: '',
    canvas_uri: 'https://canvas.instructure.com'
  }]
end

# Setup accounts
accounts.each do |account|
  if a = Account.find_by(code: account[:code])
    a.update_attributes!(account)
  else
    Account.create!(account)
  end
end


# Load QTI files
Dir.glob("db/qti/*") do |f|
  puts "****************************************************************"
  puts "Adding QTI file #{f}"
  puts "****************************************************************"
  xml_file = File.open(f, "rb").read
  Assessment.from_xml(xml_file, admin, nil, nil, f)
end

if assessment = Assessment.find_by(title: 'drupal.xml')
  assessment.recommended_height = 960
  assessment.save!
end
