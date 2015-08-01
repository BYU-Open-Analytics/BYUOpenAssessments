class Api::CheckQuestionController < Api::ApiController
  
  def create

    # store lis stuff in session
    answered_correctly = 0;
    body = JSON.parse(request.body.read);
    item_to_grade = body["itemToGrade"]
    questions = item_to_grade["questions"]
    assessment_id = item_to_grade["assessmentId"]
    outcomes = item_to_grade["outcomes"]
    assessment = Assessment.find(assessment_id)
    doc = Nokogiri::XML(assessment.assessment_xmls.first.xml)
    doc.remove_namespaces!
    xml_questions = doc.xpath("//item")

    result = assessment.assessment_results.build
    result.save!
    settings = item_to_grade["settings"]
    correct_list = []
    feedback_list = []
    confidence_level_list = []
    positive_outcome_list = []
    negative_outcome_list = []
    # This array is now the subarray ["answer"] since we did that in js frontend
    # answers = item_to_grade["answers"]
    answers = item_to_grade["answers"].collect {|a| a["answer"]}
    questions.each_with_index do |question, index|

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
          correct, feedback = grade_multiple_choice(xml_questions[xml_index], answers[index])  
        elsif type == "short_answer_question"
          correct, feedback = grade_short_answer(xml_questions[xml_index], answers[index])  
        elsif type == "essay_question"
          correct, feedback = grade_essay(xml_questions[xml_index], answers[index])  
        elsif type == "multiple_answers_question"
          correct, feedback = grade_multiple_answers(xml_questions[xml_index], answers[index])
        elsif type == "matching_question"
          correct, feedback = grade_matching(xml_questions[xml_index], answers[index])
        end
        if correct
          answered_correctly += 1
        end
        correct_list[index] = correct
	feedback_list[index] = feedback
        confidence_level_list[index] = question["confidenceLevel"]

        if item = assessment.items.find_by(identifier: question["id"])

          rendered_time, referer, user = tracking_info
          item.item_results.create(
            identifier: question["id"],
            item_id: item.id,
            eid: item.id,
            correct: correct,
            external_user_id: params["external_user_id"],
            time_elapsed: question["timeSpent"],
            src_url: settings["srcUrl"],
            assessment_result_id: result.id,
            session_status: "final",
            ip_address: request.ip,
            referer: referer,
            rendered_datestamp: rendered_time,
            confidence_level: question["confidenceLevel"],
            score: question["score"]
          )
        else
          rendered_time, referer, user = tracking_info
          item = assessment.items.build
          item.identifier = question["id"]
          item.question_text = question["material"]
          if item.save!
            item_result = item.item_results.create(
              identifier: question["id"],
              item_id: item.id,
              eid: item.id,
              correct: correct,
              external_user_id: params["external_user_id"],
              time_elapsed: question["timeSpent"],
              src_url: settings["srcUrl"],
              assessment_result_id: result.id,
              session_status: "final",
              ip_address: request.ip,
              referer: referer,
              rendered_datestamp: rendered_time,
              confidence_level: question["confidenceLevel"],
              score: question["score"]
            )
          end
        end
      end
      # TODO if the question id's dont match then check the rest of the id's
      # if the Id isn't found then there has been an error and return the error
    
    end

    score = Float(answered_correctly) / Float(questions.length)
    lti_score = score
    score *= Float(100)

    params = {
      'lis_result_sourcedid'    => settings["lisResultSourceDid"],
      'lis_outcome_service_url' => settings["lisOutcomeServiceUrl"],
      'user_id'                 => settings["lisUserId"]
    }
    
    submission_status = "Unknown error"
    if settings["isLti"]
      begin
          provider = IMS::LTI::ToolProvider.new(current_account.lti_key, current_account.lti_secret, params)
    
          # post the given score to the TC
          lti_score = (lti_score != '' ? lti_score.to_s : nil)
          p lti_score
          p provider.inspect
          # debugger
    
          res = provider.post_replace_result!(lti_score)
    
          # Need to figure out error handling - these will need to be passed to the client
          # or we can also post scores async using activejob in which case we'll want to
          # log any errors and make them visible in the admin ui
          success = res.success?
	  submission_status = (success) ? "Graded posted successfully" : "There was an error posting the grade: #{res.inspect}"
          # debugger
      rescue StandardError => bang
           "Some error: #{bang}"
      end
    end

    graded_assessment = { 
      score: score,
      feedback: "Study Harder",
      correct_list: correct_list,
      feedback_list: feedback_list,
      confidence_level_list: confidence_level_list,
      submission_status: submission_status
    }

    # Ping analytics server
    # TODO Send xAPI statement
    respond_to do |format|
      format.json { render json: graded_assessment }
    end
  end

  private

  def get_xml_index(id, xml_questions)
    xml_questions.each_with_index do |question, index|
      if question.attributes["ident"].value == id
        return index
      end
    end
    return -1
  end

  def grade_multiple_choice(question, answer) 
    correct = false;
    feedback = ""
    choices = question.children.xpath("respcondition")

    choices.each_with_index do |choice, index|
      # TODO feedback (correct and incorrect, is there even general?) here
      # if the students response id matches the correct response id for the question the answer is correct
      if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100" && answer == choice.xpath("conditionvar").xpath("varequal").children.text
        correct = true;
      end
      # Set the corresponding feedback (if there is any)
      if choice.xpath("displayfeedback").count > 0 && answer == choice.xpath("conditionvar").xpath("varequal").children.text

        feedback = question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text || ""
        p feedback
      end
    end

    return correct, feedback.strip
  end

  def grade_short_answer(question, answer) 
    correct = false;
    feedback = ""
    choices = question.children.xpath("respcondition")

    choices.each_with_index do |choice, index|
        # Need to go through each varequal, since short answers can have multiple correct answers
        choice.children.xpath("varequal").each do |possibleAnswer|
            # p "apossibility: #{possibleAnswer.text}"
            # If this answer matches, set the corresponding feedback (if there is any)
            if answer == possibleAnswer.text
            	if choice.xpath("displayfeedback").count > 0
            		feedback = question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text || ""
            		# p feedback
            	end
                    # Now check if it's a correct answer (presence of setvar with value of 100)
                    if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100"
              	  	correct = true;
                    end
            end
        end
    end
    # Get general incorrect feedback, if not correct
    if not correct
	# Check if there is any general incorrect feedback
	incorrect = question.xpath("itemfeedback[@ident='general_incorrect_fb']")
	if incorrect.count > 0
		feedback = incorrect[0].text
		# p incorrect[0].text
	end
    end
    # debugger
    # TODO return correct *and* feedback
    return correct, feedback.strip
  end

  def grade_essay(question, answer) 
    correct = false;
    feedback = ""

    answer.strip!
    # Essays are correct if they have any content
    if answer != nil && answer != ""
	    correct = true
    end

    # Check if there is any general feedback
    general_fb = question.xpath("itemfeedback[@ident='general_fb']")
    if general_fb.count > 0
    	feedback = general_fb[0].text
    end
    
    # TODO return correct *and* feedback
    return correct, feedback.strip
  end


  def grade_multiple_answers(question, answers)
    correct = false;
    feedback = ""
    choices = question.children.xpath("respcondition").children.xpath("and").xpath("varequal")
    correct_count = 0
    total_correct = choices.length
    # if the answers to many or to few then return false

    if answers.length != total_correct
      return correct
    end 
    choices.each_with_index do |choice, index|
      if answers.include?(choice.text)
        correct_count += 1;
      end
    end
    if correct_count == total_correct
      correct = true
    end

    return correct, feedback.strip
  end

  def grade_matching(question, answers)
    correct = false;
    feedback = ""
    choices = question.children.xpath("respcondition")
    total_correct = choices.length
    correct_count = 0
    choices.each_with_index do |choice, index|
      if answers[index] && choice.xpath("conditionvar").xpath("varequal").children.text == answers[index]["answerId"]
        correct_count += 1
      end
    end
    if correct_count == total_correct
      correct = true
    end

    return correct, feedback.strip
  end
  
end