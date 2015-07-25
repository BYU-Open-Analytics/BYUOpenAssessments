"use strict";

import Constants   from   "../constants";
import Api         from   "./api";
import Dispatcher  from   "../dispatcher";
import SettingsStore from '../stores/settings';

export default {

  //Valid statementName values: assessmentStarted, questionAnswered, questionAttempted, assessmentSuspsended, assessmentResumed, assessmentCompleted 

  addStandardStatementBody(body) {
	body["offline"]              = SettingsStore.current()["offline"];
	body["assessmentId"]         = SettingsStore.current()["assessmentId"];
	body["assessmentLongId"]     = SettingsStore.current()["eId"];
	body["externalUserId"]       = SettingsStore.current()["externalUserId"];
	body["resultsEndPoint"]      = SettingsStore.current()["resultsEndPoint"];
	body["assessmentUrl"]        = SettingsStore.current()["srcUrl"];
	body["timestamp"]            = new Date().toISOString();
	return body;
  },

  sendCompletionStatement(item) {
	var body = {
		statementName        : "assessmentCompleted",
		duration             : item.timeSpent,
		scaledScore          : item.score,
		questionsTotal       : item.questionCount,
		questionsAnswered    : item.questionsAnswered,
		questionsCorrect     : item.questionsCorrect
	};
	body = this.addStandardStatementBody(body);
	//console.log("actions/xapi:22 sending completion",item,body);
	Dispatcher.dispatch({ action: Constants.SEND_COMPLETION_STATEMENT})
	Api.post(Constants.SEND_COMPLETION_STATEMENT, "api/xapi", body);
  },

  sendNextStatement(item) {
	//console.log("actions/xapi:28 sending next statement",item);
	var body = {
		statementName        : "questionAttempted",
		navigationMethod     : "next",
		questionId           : item.currentIndex + 2
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_NEXT_STATEMENT})
	Api.post(Constants.SEND_NEXT_STATEMENT, "api/xapi", body);
  },

  sendPreviousStatement(item) {
	//console.log("actions/xapi:52 sending previous statement",item);
	var body = {
		statementName        : "questionAttempted",
		navigationMethod     : "previous",
		questionId           : item.currentIndex
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_PREVIOUS_STATEMENT})
	Api.post(Constants.SEND_PREVIOUS_STATEMENT, "api/xapi", body);
  },

  // Notice that we're adding 1 to question index here. We should always pass raw question index into these functions, and add 1 for human-normal value here.

  sendDirectNavigationStatement(item) {
	//console.log("actions/xapi:69 sending direct statement",item);
	var body = {
		statementName        : "questionAttempted",
		navigationMethod     : "direct",
		questionId           : item.index + 1
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_DIRECT_NAVIGATION_STATEMENT})
	Api.post(Constants.SEND_DIRECT_NAVIGATION_STATEMENT, "api/xapi", body);
  },
	
  sendQuestionAnsweredStatement(item) {
	//console.log("actions/xapi:78 sending question answered statement",item);
	var confidenceLevel = {"Just A Guess":"low","Pretty Sure":"medium","Very Sure":"high"}[item.confidenceLevel];

	var body = {
		statementName        : "questionAnswered",
		confidenceLevel      : confidenceLevel,
		questionId           : item.questionId + 1,
		duration             : item.duration,
		correct              : item.correct,
		answerGiven          : item.answerGiven,
		questionType         : item.questionType
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	//Dispatcher.dispatch({ action: Constants.SEND_QUESTION_ANSWERED_STATEMENT})
	Api.post(Constants.SEND_QUESTION_ANSWERED_STATEMENT, "api/xapi", body);
  },

  sendAssessmentSuspendedStatement(item) {
	console.log("actions/xapi:97 sending assessment suspended statement",item);

	var body = {
		statementName        : "assessmentSuspended",
		questionId           : item.questionId + 1
	};
	body = this.addStandardStatementBody(body);
	console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_ASSESSMENT_SUSPENDED_STATEMENT})
	Api.post(Constants.SEND_ASSESSMENT_SUSPENDED_STATEMENT, "api/xapi", body);
  },

  sendAssessmentResumedStatement(item) {
	  //TODO need to track question ID in suspend/resume statements
	console.log("actions/xapi:109 sending assessment resumed statement",SettingsStore.current());

	var body = {
		statementName        : "assessmentResumed",
		questionId           : item.questionId + 1
	};
	body = this.addStandardStatementBody(body);
	console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_ASSESSMENT_RESUMED_STATEMENT})
	Api.post(Constants.SEND_ASSESSMENT_RESUMED_STATEMENT, "api/xapi", body);
  },

  submitAssessment(identifier, assessmentId, questions, studentAnswers, settings){
    Dispatcher.dispatch({action: Constants.ASSESSMENT_SUBMITTED})
    //TODO extract ["answer"] out of studentAnswers, since that schema was changed to allow for local grading.
    var body = {
      itemToGrade: {
        questions    : questions,
        answers      : studentAnswers,
        assessmentId : assessmentId,
        identifier   : identifier,
        settings     : settings
      }
    }
    Api.post(Constants.ASSESSMENT_GRADED,'api/grades', body);
  },

  nextQuestion(){
    Dispatcher.dispatch({ action: Constants.ASSESSMENT_NEXT_QUESTION });
  },

  previousQuestion(){
    Dispatcher.dispatch({ action: Constants.ASSESSMENT_PREVIOUS_QUESTION });
  },
  
  assessmentViewed(settings, assessment){
    var body = {
      assessment_result : {
        offline          : settings.offline,
        assessment_id    : settings.assessmentId,
        identifier       : assessment.id,
        eId              : settings.eId,
        external_user_id : settings.externalUserId,
        resultsEndPoint  : settings.resultsEndPoint,
        keywords         : settings.keywords,
        objectives       : assessment.objectives,
        src_url          : settings.srcUrl
      }
    };
    Api.post(Constants.ASSESSMENT_VIEWED, '/api/assessment_results', body);
  },

  itemViewed(settings, assessment, assessment_result){
    var body = {
      item_result : {
        offline              : settings.offline,
        assessment_result_id : assessment_result.id,
        assessment_id        : settings.assessmentId,
        identifier           : assessment.id,
        eId                  : settings.eId,
        external_user_id     : settings.externalUserId,
        resultsEndPoint      : settings.resultsEndPoint,
        keywords             : settings.keywords,
        objectives           : assessment.objectives,
        src_url              : settings.srcUrl
      }
    };
    Api.post(Constants.ASSESSMENT_VIEWED, '/api/item_results', body);
  }
  
};
