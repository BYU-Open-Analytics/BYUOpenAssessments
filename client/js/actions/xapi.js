"use strict";

import Constants   from   "../constants";
import Api         from   "./api";
import Dispatcher  from   "../dispatcher";
import SettingsStore from '../stores/settings';

export default {

  sendCompletionStatement(item) {
	var body = {
		verb                 : "completed",
		offline              : item.settings.offline,
		assessment_id        : item.settings.assessmentId,
		identifier           : item.assessment.id,
		eId                  : item.settings.eId,
		external_user_id     : item.settings.externalUserId,
		resultsEndPoint      : item.settings.resultsEndPoint,
		src_url              : item.settings.srcUrl,
		score                : item.score
	};
	console.log("actions/xapi:11 sending completion",item,body);
	Dispatcher.dispatch({ action: Constants.SEND_COMPLETION_STATEMENT})
	Api.post(Constants.SEND_COMPLETION_STATEMENT, "api/xapi", body);
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
