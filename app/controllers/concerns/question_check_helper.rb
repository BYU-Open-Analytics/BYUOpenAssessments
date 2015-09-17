module QuestionCheckHelper

  def get_xml_index(id, xml_questions)
    xml_questions.each_with_index do |question, index|
      if question.attributes["ident"].value == id
        return index
      end
    end
    return -1
  end

  # Each of these functions returns
  # 	correct -> boolean
  # 	feedback -> hash containing:
  # 		hint (general question feedback from QTI)
  # 		correct_answers (an array of all correct answers from QTI)
  # 		feedback ((in)correct-specific, or answer-specific question feedback)

  def grade_multiple_choice(question, answer) 
    correct = false;
    feedback = {
	hint: "",
	correct_answers: [],
	feedback: ""
    }
    choices = question.children.xpath("respcondition")

    choices.each_with_index do |choice, index|
      # find the correct response
      # put the correct response into our feedback hash
      if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100" 
        feedback[:correct_answers] << question.xpath("///response_label[@ident='#{choice.xpath("conditionvar").xpath("varequal").children.text}']").xpath("material").children.text.strip
      end

      # if the students response id matches the correct response id for the question the answer is correct
      if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100" && answer == choice.xpath("conditionvar").xpath("varequal").children.text
        correct = true;
      end
      # Set the corresponding answer-specific feedback for the user's answer (if there is any)
      if choice.xpath("displayfeedback").count > 0 && answer == choice.xpath("conditionvar").xpath("varequal").children.text

        feedback[:feedback] += question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text.strip || ""
      end
    end

    feedback[:feedback] += "\n" + get_question_feedback(question, correct)
    feedback[:hint] = get_hint(question)

    return correct, feedback
  end

  def grade_short_answer(question, answer) 
    correct = false;
    feedback = {
	hint: "",
	correct_answers: [],
	feedback: ""
    }
    choices = question.children.xpath("respcondition")

    choices.each_with_index do |choice, index|
        # Need to go through each varequal, since short answers can have multiple correct answers
        choice.children.xpath("varequal").each do |possibleAnswer|
            # If it is correct, add it to the list of correct answers
            if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100"
              feedback[:correct_answers] << possibleAnswer.text
	    end
            # If this answer matches (case insensitive and space insensitive), set the corresponding feedback (if there is any)
            if answer.downcase.gsub(/\s+/, "") == possibleAnswer.text.downcase.gsub(/\s+/, "")
            # if answer.casecmp(possibleAnswer.text) == 0
            	if choice.xpath("displayfeedback").count > 0
            		feedback[:feedback] += question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text || ""
            	end
                # Now check if it's a correct answer (presence of setvar with value of 100)
                if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100"
          	  	correct = true;
                end
            end
        end
    end

    feedback[:feedback] += get_question_feedback(question, correct)
    feedback[:hint] = get_hint(question)

    return correct, feedback
  end

  def grade_essay(question, answer) 
    correct = false;
    feedback = {
	hint: "",
	correct_answers: [],
	feedback: ""
    }

    answer.strip!
    # Essays are correct if they have any content
    if answer != nil && answer != ""
	    correct = true
    end
    
    # Since there are not 'correct' answers for essays, show the general feedback as both hint and correct answer
    essay_hint = get_hint(question)
    feedback[:correct_answers] << essay_hint
    feedback[:hint] = essay_hint

    return correct, feedback
  end

  def get_question_feedback(question, correct)
    feedback = ""
    # Get question incorrect/correct feedback
    if not correct
	# Check if there is any general incorrect feedback
	incorrect = question.xpath("itemfeedback[@ident='general_incorrect_fb']")
	if incorrect.count > 0
		feedback += "\n#{incorrect[0].text.strip}"
	end
    else
	# Check if there is any general correct feedback
	correct = question.xpath("itemfeedack[@ident='correct_fb']")
	if correct.count > 0
		feedback += "\n#{correct[0].text.strip}"
	end
    end
    return feedback.strip
  end

  def get_hint(question)
    # Get general question feedback, which we're using as the hint
    hint = question.xpath("itemfeedback[@ident='general_fb']")
    if hint.count > 0
      return "#{hint[0].text.strip}"
    else
      return ""
    end
  end

  # These are unused functions from lumen
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
