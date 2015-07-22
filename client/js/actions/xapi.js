"use strict";

import Constants   from   "../constants";
import Api         from   "./api";
import Dispatcher  from   "../dispatcher";
import SettingsStore from '../stores/settings';

export default {

  //Valid statementName values: assessmentStarted, questionAnswered, questionAttempted, assessmentSuspsended, assessmentResumed, assessmentCompleted 

  sendCompletionStatement(item) {
	var body = {
		statementName        : "assessmentCompleted",
		offline              : item.settings.offline,
		assessmentId         : item.settings.assessmentId,
		identifier           : item.assessment.id,
		eId                  : item.settings.eId,
		externalUserId       : item.settings.externalUserId,
		resultsEndPoint      : item.settings.resultsEndPoint,
		assessmentUrl        : item.settings.srcUrl,
		scaledScore          : item.score,
		questionsTotal       : item.questionCount,
		questionsAnswered    : item.questionsAnswered,
		questionsCorrect     : item.questionsCorrect
	};
	console.log("actions/xapi:22 sending completion",item,body);
	Dispatcher.dispatch({ action: Constants.SEND_COMPLETION_STATEMENT})
	Api.post(Constants.SEND_COMPLETION_STATEMENT, "api/xapi", body);
  },

  sendNextStatement(item) {
	console.log("actions/xapi:28 sending next statement",item);
	var body = {
		statementName        : "questionAttempted",
		navigationMethod     : "next",
		questionId           : item.currentIndex + 1,
		assessmentId         : item.settings.assessmentId,
		identifier           : item.assessment.id,
		eId                  : item.settings.eId,
		externalUserId       : item.settings.externalUserId,
		assessmentUrl        : item.settings.srcUrl
	};
	console.log(body);
	Dispatcher.dispatch({ action: Constants.SEND_NEXT_STATEMENT})
	Api.post(Constants.SEND_NEXT_STATEMENT, "api/xapi", body);
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
