"use strict";

import React              from 'react';
import BaseComponent      from "../base_component";
import AssessmentActions  from "../../actions/assessment";
import XapiActions        from "../../actions/xapi";
import UniversalInput     from "./universal_input";
import AssessmentStore    from "../../stores/assessment";
import Utils              from "../../utils/utils";


export default class Item extends BaseComponent{
  constructor(){
    super();
    this._bind("getConfidenceLevels", "confidenceLevelClicked", "getPreviousButton", "getNextButton", "getStyles");
  }

  nextButtonClicked(){
    this.setState({unAnsweredQuestions: null})
    XapiActions.sendNextStatement(this.props);
    AssessmentActions.nextQuestion();
    this.setState({showMessage: false});
  }

  previousButtonClicked(){
    this.setState({unAnsweredQuestions: null})
    XapiActions.sendPreviousStatement(this.props);
    AssessmentActions.previousQuestion();
    this.setState({showMessage: false});
  }

  confidenceLevelClicked(e, currentIndex){
    e.preventDefault();
    //AssessmentActions.checkAnswer();
    AssessmentActions.selectConfidenceLevel(e.target.value, currentIndex);
    this.checkAnswerRemotely();
  }

  hintButtonClicked() {
    //console.log("components/item:40 hint button clicked");
    if (this.props.messageIndex > -1) {
	    XapiActions.sendQuestionHintShownStatement(this.props);
	    this.setState({showHint: true});
	    this.props.messageFeedback.showHint = true;
    } else {
	    alert("Please attempt the question at least once before using a hint.");
    }
  }
  
  answerButtonClicked() {
    //console.log("components/item:44 answer button clicked");
    if (this.props.messageIndex > -1) {
	    XapiActions.sendQuestionAnswerShownStatement(this.props);
	    // TODO set this and showHint to false wherever state is setup / reset
	    this.setState({showCorrectAnswers: true});
	    this.props.messageFeedback.showCorrectAnswers = true;
    } else {
	    alert("Please attempt the question at least once before viewing the correct answers.");
    }
  }

  checkAnswerRemotely() {
    //Store a reference to this function so we can call it in the timeout and get the actual answer that otherwise wouldn't be in here because we're calling it too soon (I think that's why it otherwise doesn't work).
    var studentAnswersFunction = AssessmentStore.studentAnswers;
    var body = [this.props.assessment.id, this.props.assessment.assessmentId, this.props.question, null, this.props.settings];
    setTimeout( function() {
	    //console.log("item.jsx:35 want to send stuff for remote answer checking",studentAnswersFunction()["answer"],body);
	    AssessmentActions.checkAnswerRemotely(body[0], body[1], body[2], studentAnswersFunction()["answer"], body[4]);
    }, 1);

  }

  submitButtonClicked(e){
    //This will save the answer of the current question so it can be correctly marked as complete
    if (this.props.currentIndex > 0) {
	    AssessmentActions.previousQuestion(); 
	    AssessmentActions.checkAnswer();
	    AssessmentActions.nextQuestion();
    } else {
	    AssessmentActions.nextQuestion();
	    AssessmentActions.checkAnswer();
	    AssessmentActions.previousQuestion();
    }

    e.preventDefault()

    var numTotal = this.props.questionCount;
    var numCorrect = 0;
    for (var i = 0; i < this.props.studentAnswers.length; i++) {
	if (this.props.studentAnswers[i]["correct"] == true) {
		numCorrect += 1;
	}
    }
    //console.log("components/assessments/item:43 got " + numCorrect + " correct out of " + numTotal + " total questions. Score of " + this.props.score*100 + "%.");
    var complete = this.checkCompletion();
    var confirmMessage = (complete == true) ? "You have answered all questions. Submit the quiz?" : "You left the following questions blank: " + this.formatUnansweredString(complete) + ". Submit the quiz anyway?";
    if (confirm(confirmMessage)) {
      this.setState({loading: true});
      AssessmentActions.submitAssessment(this.props.assessment.id, this.props.assessment.assessmentId, this.props.allQuestions, this.props.studentAnswers, this.props.settings);
    } else if (complete != true) {
      this.setState({unAnsweredQuestions: complete});
    }
  }

  checkCompletion(){
    var questionsNotAnswered = [];
    for (var i = 0; i < this.props.studentAnswers.length; i++) {
      if(this.props.studentAnswers[i]["answer"] == null || this.props.studentAnswers[i]["answer"].length == 0){
        questionsNotAnswered.push(i+1);
      }
    };
    if(questionsNotAnswered.length > 0){
      return questionsNotAnswered;
    }
    return true;
  }

  formatUnansweredString(arr){
    var outStr = "";
    if (arr.length === 1) {
        outStr = arr[0];
    } else if (arr.length === 2) {
        outStr = arr.join(' and ');
    } else if (arr.length > 2) {
        outStr = arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1);
    }
    return outStr;
  }

  getStyles(theme){
    var navMargin = "-50px 20px 0 0";
    if(this.props.settings.confidenceLevels)
      navMargin = "-75px 20px 0 0";
    return {
      assessmentContainer:{
        marginTop: this.props.settings.assessmentKind.toUpperCase() == "FORMATIVE" ?  "20px" : "100px",
        boxShadow: theme.assessmentContainerBoxShadow,
        borderRadius: theme.assessmentContainerBorderRadius
      },
      header: {
        backgroundColor: theme.headerBackgroundColor
      },
      fullQuestion:{
        backgroundColor: this.props.settings.assessmentKind.toUpperCase() == "FORMATIVE" ? theme.outcomesBackgroundColor : theme.fullQuestionBackgroundColor,
        paddingBottom: "20px",
      },
      questionText: {
        fontSize: theme.questionTextFontSize,
        fontWeight: theme.questionTextFontWeight,
        padding: theme.questionTextPadding,
      },
      nextButton: {
        backgroundColor: theme.nextButtonBackgroundColor
      },
      previousButton: {
        backgroundColor: theme.previousButtonBackgroundColor
      },
      maybeButton: {
        width: theme.maybeWidth,
        backgroundColor: theme.maybeBackgroundColor,
        color: theme.maybeColor,
      },
      probablyButton: {
        width: theme.probablyWidth,
        backgroundColor: theme.probablyBackgroundColor,
        color: theme.probablyColor,
      },
      definitelyButton: {
        width: theme.definitelyWidth,
        backgroundColor: theme.definitelyBackgroundColor,
        color: theme.definitelyColor,
      },
      hintButton: {
        width: "100px",
        backgroundColor: (this.props.messageIndex > -1) ? theme.nextButtonBackgroundColor : "#bbb",
        color: theme.maybeColor,
	borderBottomRightRadius: "0px",
	borderTopRightRadius: "0px",
	borderRightColor: "white",
	marginLeft: "20px",
      },
      answerButton: {
        width: "100px",
        backgroundColor: (this.props.messageIndex > -1) ? theme.nextButtonBackgroundColor : "#bbb",
        color: theme.maybeColor,
	borderBottomLeftRadius: "0px",
	borderTopLeftRadius: "0px",
      },
      submitButton: {
        width: theme.definitelyWidth,
        backgroundColor: (this.checkCompletion() == true) ? theme.submitBackgroundColor : "#bbb",
        color: theme.definitelyColor,
      },
      confidenceWrapper: {

        border: theme.confidenceWrapperBorder,
        borderRadius: theme.confidenceWrapperBorderRadius,
        width: theme.confidenceWrapperWidth,
        height: theme.confidenceWrapperHeight,
        padding: theme.confidenceWrapperPadding,
        margin: theme.confidenceWrapperMargin,
        backgroundColor: theme.confidenceWrapperBackgroundColor,
      },
      margin: {
       marginLeft: "5px"
      },
      navButtons: {
        margin: navMargin
      },
      submitButtonDiv: {
        marginLeft: "40px",
        marginTop: "16px"
      },
      warning: {
        margin: theme.confidenceWrapperMargin,
        border: "1px solid transparent",
        borderRadius: "4px",
        backgroundColor: theme.maybeBackgroundColor,
        color: theme.maybeColor,
        padding: "8px 8px !important"
      },
      footer: {
        borderTop: "1px solid gray",
        borderBottom: "5px solid " + theme.footerBackgroundColor,
        position: "absolute",
        left: "0px",
        bottom: "1px",
        marginTop: "20px",
        width: "100%",
        height: theme.footerHeight,
        backgroundColor: theme.footerBackgroundColor,
      },
      footerPrev: {
        height: theme.footerHeight,
        width: "100px",
        float: "left",
      },
      footerNext: {
        height: theme.footerHeight,
        width: "100px",
        float: "right"
      },
      icon: {
        height: "62px",
        width: "62px",
        fontColor: theme.probablyBackgroundColor
      },
      data: {
        marginTop: "-5px"
      },
      selfCheck: {
        fontSize: "140%"
      },
      checkDiv: {
        backgroundColor: theme.probablyBackgroundColor,
        margin: "20px 0px 0px 0px"
      },
      h4: {
        color: "white"
      },
      chooseText: {
        color: "grey",
        fontSize: "90%",
        paddingBottom: "20px"
      }
    }
  }
  getFooterNav(theme, styles){
    if(theme.shouldShowFooter){
      return  <div style={styles.footer}>
                <button style={styles.footerPrev} onClick={()=>{this.previousButtonClicked()}}>
                <i className="glyphicon glyphicon-chevron-left"></i>
                Previous
                </button>
                <button style={styles.footerNext} onClick={()=>{this.nextButtonClicked()}}>
                Next
                <i className="glyphicon glyphicon-chevron-right"></i>
                </button>
              </div>
    }

    return "";
  }

  getWarning(state, questionCount, questionIndex, styles){
    if(state && state.unAnsweredQuestions && state.unAnsweredQuestions.length > 0 && questionIndex + 1 == questionCount){
      return <div style={styles.warning}>You left question(s) {state.unAnsweredQuestions.join()} blank. Use the "Progress" drop-down menu at the top to go back and answer the question(s), then come back and submit.</div>
    }

    return "";
  }

  getConfidenceLevels(level, styles){
    if(level){
      var levelMessage = <div style={{marginBottom: "10px"}}><b>How sure are you of your answer? Click below to save and check your answer.</b></div>;
      return    (<div className="confidence_wrapper" style={styles.confidenceWrapper}>
                  {levelMessage}
                  <input type="button" style={styles.maybeButton}className="btn btn-check-answer" value="Just A Guess" onClick={(e) => { this.confidenceLevelClicked(e, this.props.currentIndex) }}/>
                  <input type="button" style={{...styles.margin, ...styles.probablyButton}} className="btn btn-check-answer" value="Pretty Sure" onClick={(e) => { this.confidenceLevelClicked(e, this.props.currentIndex) }}/>
                  <input type="button" style={{...styles.margin, ...styles.definitelyButton}} className="btn btn-check-answer" value="Very Sure" onClick={(e) => { this.confidenceLevelClicked(e, this.props.currentIndex) }}/>
                </div>
                );
    } else {
      return <div className="lower_level"><input type="button" className="btn btn-check-answer" value="Check Answer" onClick={() => { this.checkAnswerRemotely(); }}/></div>
    }
  }

  getHintButton(styles) {
	  if (this.props.messageIndex > -1) {
		  return (<button className="btn btn-hint btn-active" style={styles.hintButton} onClick={() => { this.hintButtonClicked() }}>
				<span>Show Hint</span>
			  </button>);
	  } else {
		  return (<button className="btn btn-hint" style={styles.hintButton} onClick={() => { this.hintButtonClicked() }}>
				<span>Show Hint</span>
			  </button>);
	  }

  }

  getAnswerButton(styles) {
	  var className = (this.props.messageIndex > -1) ? "btn btn-answer btn-active" : "btn btn-answer";
	  return (<button className={className} style={styles.answerButton} onClick={() => { this.answerButtonClicked() }}>
			<span>Show Answer</span>
		  </button>);
  }

  getNextButton(styles){
    var nextButton = "";
    var nextButtonClassName = "btn btn-next-item " + ((this.props.currentIndex < this.props.questionCount - 1) ? "" : "disabled");
    if(!this.context.theme.shouldShowNextPrevious && this.props.confidenceLevels){
      return nextButton;
    }
    nextButton =(<button className={nextButtonClassName} style={styles.nextButton} onClick={() => { this.nextButtonClicked() }}>
                    <span>Next</span> <i className="glyphicon glyphicon-chevron-right"></i>
                  </button>);
    return nextButton;
  }

  getPreviousButton(styles){
    var previousButton = "";
    var prevButtonClassName = "btn btn-prev-item " + ((this.props.currentIndex > 0) ? "" : "disabled");
    if(!this.context.theme.shouldShowNextPrevious  && this.props.confidenceLevels){
      return previousButton;
    }
    previousButton =(<button className={prevButtonClassName} style={styles.previousButton} onClick={() => { this.previousButtonClicked() }}>
                    <i className="glyphicon glyphicon-chevron-left"></i><span>Previous</span>
                  </button>);
    return previousButton;
  }


  getResult(state, index, feedback){
    var result;

    if(index == -1){
      result =  <div className="check_answer_result">
                  <p></p>
                </div>;
    }
    else if(index == "loading") {
      result =  <div className="check_answer_result answer_result_loading">
                  <img src={this.props.settings.images.spinner_gif} /><p>Checking...</p>
                </div>;
    }
    else {
      var correct = (index != 0);
      var resultClassName = correct ? "check_answer_result answer_result_correct" : "check_answer_result answer_result_incorrect";
      var resultText = correct ? "Correct" : "Incorrect";
      var hint = (feedback.showHint == true) ? <div className="result_hint"><b>Hint: </b><span dangerouslySetInnerHTML={{__html: feedback.hint}}></span></div> : "";
      var correctAnswers = "";
      if (feedback.showCorrectAnswers == true) {
       correctAnswers = <div className="result_correct_answers"><b>Correct Answer(s)</b><ul> {
			feedback.correct_answers.map(function(answer) {
				return <li dangerouslySetInnerHTML={{__html: answer}}></li>
			})
		  } </ul></div>;
      }
      result =  <div className={resultClassName}>
                  <p>{resultText}</p>
		  <div className="result_feedback" dangerouslySetInnerHTML={{__html: feedback.feedback}}></div>
		  {hint}
      		  {correctAnswers}
                </div>;
    }

    return result;
  }


  render() {
    var styles = this.getStyles(this.context.theme);
    var unAnsweredWarning = this.getWarning(this.state,  this.props.questionCount, this.props.currentIndex, styles);
    var result = this.getResult(this.state, this.props.messageIndex, this.props.messageFeedback);
    var message = this.state && this.state.showMessage ? <div style={styles.warning}>You must select an answer before continuing.</div> : "";
    var confidenceButtons = this.getConfidenceLevels(this.props.confidenceLevels, styles);
    var hintButton = this.getHintButton(styles);
    var answerButton = this.getAnswerButton(styles);
    //var submitButton = (this.props.currentIndex == this.props.questionCount - 1) ? <button className="btn btn-check-answer" style={styles.definitelyButton}  onClick={(e)=>{this.submitButtonClicked(e)}}>Submit Quiz</button> : "";
    //TODO change the appearance of this button when all questions have been answered, like canvas
    //console.log("item:327 render",this.state);
    var submitButton = (this.state && this.state.loading == true) ? <span><img src={this.props.settings.images.spinner_gif} />&nbsp;&nbsp;&nbsp;Grading...</span> : <button className="btn btn-check-answer" style={styles.submitButton}  onClick={(e)=>{this.submitButtonClicked(e)}}>Submit Quiz</button>;
    // From aug6merge for only showing button on last question.
    // var submitButton = (this.props.currentIndex == this.props.questionCount - 1 && this.props.question.confidenceLevel) ? <button className="btn btn-check-answer" style={styles.submitButton}  onClick={(e)=>{this.submitButtonClicked(e)}}>Submit</button> : "";
    var footer = this.getFooterNav(this.context.theme, styles);

    // Get the confidence Level

    var nextButton = this.getNextButton(styles);
    var previousButton = this.getPreviousButton(styles);

    //Check if we need to display the counter in the top right
    var counter = "";

    if(this.context.theme.shouldShowCounter){
      counter = <span className="counter">{this.props.currentIndex + 1} of {this.props.questionCount}</span>
    }
    var formativeHeader = ""
    if(this.props.settings.assessmentKind.toUpperCase() == "FORMATIVE"){
      formativeHeader =
          <div>
            <div className="row">
            </div>
            <div className="row" style={styles.checkDiv}>
              <div className="col-md-10">
                <h4 style={styles.h4}>{this.props.assessment.title}</h4>
              </div>
              <div className="col-md-2">
              </div>
            </div>
          </div>
    }
    var formativeStyle = this.props.settings.assessmentKind.toUpperCase() == "FORMATIVE" ? {padding: "0px 20px 20px 20px"} : {};
    return (
      <div className="assessment_container" style={styles.assessmentContainer}>
        <div className="question">
          <div className="header" style={styles.header}>
            {counter}
            <p>{this.props.question.title}</p>
          </div>
          <div style={formativeStyle}>
            {formativeHeader}
            <div className="edit_item">
              <div className="full_question" style={styles.fullQuestion}>
                <div className="inner_question">
                  <div className="question_text" style={styles.questionText}>
                    <div
                      dangerouslySetInnerHTML={{
                    __html: this.props.question.material
                    }}>
                    </div>
                  </div>
                  <UniversalInput item={this.props.question} isResult={false}/>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    {result}
                    {confidenceButtons}
		    {hintButton}
		    {answerButton}
                    {unAnsweredWarning}
                    {message}
                  </div>
                </div>
              </div>
            </div>
            <div className="nav_buttons" style={styles.navButtons}>
              {previousButton}
              {nextButton}
            </div>
	    <div style={styles.submitButtonDiv}>
	      {submitButton}
	    </div>
          </div>
          {footer}
        </div>
      </div>
    );
  }

}

Item.propTypes = {
  question         : React.PropTypes.object.isRequired,
  currentIndex     : React.PropTypes.number.isRequired,
  questionCount    : React.PropTypes.number.isRequired,
  messageIndex     : React.PropTypes.number.isRequired,
  messageFeedback  : React.PropTypes.string.isRequired,
  confidenceLevels : React.PropTypes.bool.isRequired,
  outcomes         : React.PropTypes.object
};

Item.contextTypes = {
  theme: React.PropTypes.object
}
