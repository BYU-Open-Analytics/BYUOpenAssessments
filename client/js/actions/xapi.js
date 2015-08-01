"use strict";

import Constants   from   "../constants";
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

  sendAssessmentLaunchedStatement(item) {
	var body = {
		statementName        : "assessmentLaunched"
	};
	body = this.addStandardStatementBody(body);
	//console.log("actions/xapi:28 sending launched",item,body);
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_ASSESSMENT_LAUNCHED_STATEMENT, statement: body})
	//Api.post(Constants.SEND_ASSESSMENT_LAUNCHED_STATEMENT, "api/xapi", body);
  },

  sendAssessmentCompletedStatement(item) {
	var body = {
		statementName        : "assessmentCompleted",
		duration             : item.duration,
		scaledScore          : item.scaledScore,
		questionsTotal       : item.questionsTotal,
		questionsAnswered    : item.questionsAnswered,
		questionsCorrect     : item.questionsCorrect
	};
	body = this.addStandardStatementBody(body);
	console.log("actions/xapi:43 sending completed",item,body);
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_COMPLETION_STATEMENT, statement: body})
	//Api.post(Constants.SEND_COMPLETION_STATEMENT, "api/xapi", body);
	this.flushStatementQueue(true);
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
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_NEXT_STATEMENT})
	//Api.post(Constants.SEND_NEXT_STATEMENT, "api/xapi", body);
	this.flushStatementQueue(false);
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
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_PREVIOUS_STATEMENT})
	//Api.post(Constants.SEND_PREVIOUS_STATEMENT, "api/xapi", body);
	this.flushStatementQueue(false);
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
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_DIRECT_NAVIGATION_STATEMENT})
	//Api.post(Constants.SEND_DIRECT_NAVIGATION_STATEMENT, "api/xapi", body);
	this.flushStatementQueue(false);
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
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_QUESTION_ANSWERED_STATEMENT})
	//Api.post(Constants.SEND_QUESTION_ANSWERED_STATEMENT, "api/xapi", body);
  },

  sendAssessmentSuspendedStatement(item) {
	var body = {
		statementName        : "assessmentSuspended",
		questionId           : item.questionId + 1
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_ASSESSMENT_SUSPENDED_STATEMENT})
	//Api.post(Constants.SEND_ASSESSMENT_SUSPENDED_STATEMENT, "api/xapi", body);
  },

  sendAssessmentResumedStatement(item) {
	var body = {
		statementName        : "assessmentResumed",
		questionId           : item.questionId + 1
	};
	body = this.addStandardStatementBody(body);
	//console.log(body);
	Dispatcher.dispatch({ action: Constants.ENQUEUE_STATEMENT, statement: body });
	//Dispatcher.dispatch({ action: Constants.SEND_ASSESSMENT_RESUMED_STATEMENT})
	//Api.post(Constants.SEND_ASSESSMENT_RESUMED_STATEMENT, "api/xapi", body);
  },

  flushStatementQueue(forcibly) {
	  Dispatcher.dispatch({ action: Constants.FLUSH_STATEMENT_QUEUE, forcibly: forcibly });
  }

};
