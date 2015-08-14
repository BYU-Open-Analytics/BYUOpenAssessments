class Api::QuestionTextController < Api::ApiController
  
  skip_before_action :validate_token, only: [:create]
  
  def create

    # store lis stuff in session
    answered_correctly = 0;
    body = JSON.parse(request.body.read);
    assessment_ids = body["assessment_ids"]

    question_texts = {}
    assessment_ids.each_with_index do |id, index|
        p id
	begin
          assessment = Assessment.find(id)
	  question_texts[id] = []
          doc = Nokogiri::XML(assessment.assessment_xmls.where(kind: "formative").last.xml)
          doc.remove_namespaces!
          xml_questions = doc.xpath("//item")
	  xml_questions.each_with_index do |question, index|
	      question_texts[id] << question.css('presentation/material/mattext').last.text
	  end
	  p question_texts[id]
	rescue => e
          # assessment not found
	end
    end

    respond_to do |format|
      format.json { render json: question_texts }
    end
  end
  
end
