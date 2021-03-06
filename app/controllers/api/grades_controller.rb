class Api::GradesController < Api::ApiController
  include QuestionCheckHelper
  
  skip_before_action :validate_token, only: [:create]
  
  def create

    # store lis stuff in session
    answered_correctly = 0;
    body = JSON.parse(request.body.read);
    item_to_grade = body["itemToGrade"]
    questions = item_to_grade["questions"]
    assessment_id = item_to_grade["assessmentId"]
    outcomes = item_to_grade["outcomes"]
    assessment = Assessment.find(assessment_id)
    doc = Nokogiri::XML(assessment.assessment_xmls.where(kind: "formative").last.xml)
    doc.remove_namespaces!
    xml_questions = doc.xpath("//item")
    errors = []
    result = assessment.assessment_results.build
    result.user = current_user
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
    ungraded_questions = []
    xml_index_list = []
    
    questions.each_with_index do |question, index|

      # make sure we are looking at the right question
      xml_index = get_xml_index(question["id"], xml_questions)
      xml_index_list.push(xml_index)
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
      else
        ungraded_questions.push(question)
      end
      # TODO if the question id's dont match then check the rest of the id's
      # if the Id isn't found then there has been an error and return the error
    
    end

    params = {
      'lis_result_sourcedid'    => settings["lisResultSourceDid"],
      'lis_outcome_service_url' => settings["lisOutcomeServiceUrl"],
      'user_id'                 => settings["lisUserId"]
    }
    # Ampersand will get encoded weird in html output, which then gets passed through weird. This is just a stopgap fix.
    params['lis_outcome_service_url'].gsub! '&amp;', '&'

    # Calculate score
    score = Float(answered_correctly) / Float(questions.length)
    canvas_score = score
    score *= Float(100)

	# Determine if we're attemping LTI grade passback, based on URL grade_passback parameter
	attempt_lti = settings["gradePassback"] ? (settings["gradePassback"] == true || settings["gradePassback"] == "true") : false
	# Default result status to practice only
    submission_status = "For practice only. Grade not posted."

	# If we're attemping passback and there's a passback URL
    if attempt_lti && settings["isLti"] && !params['lis_outcome_service_url'].blank?
      # Save the assessment result incase LTI grade passback fails
      result.score = score
      result.external_user_id = params["external_user_id"]
      result.save!

      higher_grade = true
      success = false;

      # If we have a higher score from any previous attempts, don't post this score back to LTI.
      previous_results = current_user.present? ? current_user.assessment_results.where(assessment_id: assessment.id).where("score > ?", score).order(score: :desc) : nil
      if previous_results != nil and previous_results.count > 0
        higher_grade = false
        submission_status = "Your higher score of #{'%.2f' % previous_results.first.score}% was kept, and this score was not submitted."
      end
      if higher_grade == true
        submission_status = "Unknown error"
        begin
        provider = IMS::LTI::ToolProvider.new(current_account.lti_key, current_account.lti_secret, params)
        # post the given score to the TC
        canvas_score = (canvas_score != '' ? canvas_score.to_s : nil)

        res = provider.post_replace_result!(canvas_score)

        # Need to figure out error handling - these will need to be passed to the client
        # or we can also post scores async using activejob in which case we'll want to
        # log any errors and make them visible in the admin ui
        success = res.success?
        rescue => e
          begin
          provider = IMS::LTI::ToolProvider.new(current_account.lti_key, current_account.lti_secret, params)

          # post the given score to the TC
          canvas_score = (canvas_score != '' ? canvas_score.to_s : nil)

          res = provider.post_replace_result!(canvas_score)

          # Need to figure out error handling - these will need to be passed to the client
          # or we can also post scores async using activejob in which case we'll want to
          # log any errors and make them visible in the admin ui
          success = res.success?
          rescue => e
            errors.push(e.message)
          end
        end

        submission_status = (success) ? "Grade posted via LTI successfully." : "There was an error posting the grade: #{res.inspect} #{res.code_major}."
        if !success
          errors.push("Grade writeback failed.")
        end
      end
    end


    graded_assessment = { 
      score: score,
      feedback: "Study Harder",
      correct_list: correct_list,
      feedback_list: feedback_list,
      confidence_level_list: confidence_level_list,
      submission_status: submission_status,
      ungraded_questions: ungraded_questions,
      item_to_grade:item_to_grade,
      xml_questions: xml_questions,
      xml_index_list: xml_index_list,
      questions: questions,
      doc: doc,
      lti_params: params,
      errors: errors
    }
    respond_to do |format|
      format.json { render json: graded_assessment }
    end
  end
  
end

