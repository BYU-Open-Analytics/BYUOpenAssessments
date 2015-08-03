module QuestionCheckHelper

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
      # if the students response id matches the correct response id for the question the answer is correct
      if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100" && answer == choice.xpath("conditionvar").xpath("varequal").children.text
        correct = true;
      end
      # Set the corresponding feedback (if there is any)
      if choice.xpath("displayfeedback").count > 0 && answer == choice.xpath("conditionvar").xpath("varequal").children.text

        feedback += question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text || ""
      end
    end

    feedback += get_general_feedback(question, correct)

    return correct, feedback.strip
  end

  def grade_short_answer(question, answer) 
    correct = false;
    feedback = ""
    choices = question.children.xpath("respcondition")

    choices.each_with_index do |choice, index|
        # Need to go through each varequal, since short answers can have multiple correct answers
        choice.children.xpath("varequal").each do |possibleAnswer|
            # If this answer matches, set the corresponding feedback (if there is any)
            if answer == possibleAnswer.text
            	if choice.xpath("displayfeedback").count > 0
            		feedback += question.xpath("itemfeedback[@ident='#{choice.xpath("displayfeedback")[0]["linkrefid"]}']").text || ""
            	end
                # Now check if it's a correct answer (presence of setvar with value of 100)
                if choice.xpath("setvar").count > 0 && choice.xpath("setvar")[0].children.text == "100"
          	  	correct = true;
                end
            end
        end
    end

    feedback += get_general_feedback(question, correct)

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
    
    feedback += get_general_feedback(question, correct)

    return correct, feedback.strip
  end

  def get_general_feedback(question, correct)
    feedback = ""
    # Get general incorrect/correct feedback
    if not correct
	# Check if there is any general incorrect feedback
	incorrect = question.xpath("itemfeedback[@ident='general_incorrect_fb']")
	if incorrect.count > 0
		feedback += "\n#{incorrect[0].text}"
	end
    else
	# Check if there is any general correct feedback
	correct = question.xpath("itemfeedack[@ident='correct_fb']")
	if correct.count > 0
		feedback += "\n#{correct[0].text}"
	end
    end

    # Get general question feedback
    general = question.xpath("itemfeedback[@ident='general_fb']")
    if general.count > 0
      feedback += "\n#{general[0].text}"
    end
    return feedback.strip
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
