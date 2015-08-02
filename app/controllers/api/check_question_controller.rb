class Api::CheckQuestionController < Api::ApiController
  include QuestionCheckHelper
  def create

    body = JSON.parse(request.body.read);
    item_to_grade = body["itemToGrade"]
    question = item_to_grade["question"]
    assessment_id = item_to_grade["assessmentId"]
    assessment = Assessment.find(assessment_id)
    doc = Nokogiri::XML(assessment.assessment_xmls.first.xml)
    doc.remove_namespaces!
    xml_questions = doc.xpath("//item")

    settings = item_to_grade["settings"]
    answer = item_to_grade["answer"]

    # make sure we are looking at the right question
    xml_index = get_xml_index(question["id"], xml_questions)
    if question["id"] == xml_questions[xml_index].attributes["ident"].value

        correct = false;
        feedback = ""
        # find the question type
        type = xml_questions[xml_index].children.xpath("qtimetadata").children.xpath("fieldentry").children.text
        
        # if the question type gets some wierd stuff if means that the assessment has outcomes so we need
        # to get the question data a little differently
        if type != "multiple_choice_question" && type != "multiple_answers_question" && type != "matching_question"
          type = xml_questions[xml_index].children.xpath("qtimetadata").children.xpath("fieldentry").children.first.text
        end

        # grade the question based off of question type
        if type == "multiple_choice_question"
          correct, feedback = grade_multiple_choice(xml_questions[xml_index], answer)  
        elsif type == "short_answer_question"
          correct, feedback = grade_short_answer(xml_questions[xml_index], answer)  
        elsif type == "essay_question"
          correct, feedback = grade_essay(xml_questions[xml_index], answer)  
        elsif type == "multiple_answers_question"
          correct, feedback = grade_multiple_answers(xml_questions[xml_index], answer)
        elsif type == "matching_question"
          correct, feedback = grade_matching(xml_questions[xml_index], answer)
        end

	# TODO return question id or some other way to make sure js frontend can line up this result with the correct question. Probably return everything in this that frontend needs to send statement.

    end

    question_result = { 
      correct: correct,
      feedback: feedback,
      confidence_level: question["confidenceLevel"],
      question_id: question["id"]
    }

    respond_to do |format|
      format.json { render json: question_result }
    end
  end

end
