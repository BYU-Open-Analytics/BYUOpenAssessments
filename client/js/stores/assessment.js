"use strict";

import Dispatcher     from "../dispatcher";
import Constants      from "../constants";
import Utils          from "../utils/utils";
import StoreCommon    from "./store_common";
import assign         from "object-assign";
import Assessment     from "../models/assessment";
import SettingsStore  from "./settings";
import EdX            from "../models/edx";
import _              from "lodash";
import XapiActions    from "../actions/xapi";
const INVALID = -1;
const NOT_LOADED = 0;
const LOADING = 1;
const LOADED = 2;
const READY = 3;
const STARTED = 4;

var _assessment = null;
var _assessmentXml = null;
var _items = [];
var _outcomes = [];
var _assessmentResult = null;
var _assessmentState = NOT_LOADED;
var _startedAt;
var _finishedAt;
var _selectedConfidenceLevel = 0;
var _selectedAnswerIds = "";
var _answerMessageIndex = -1;
var _answerMessageFeedback = "";
var _sectionIndex = 0;
var _itemIndex = 0;
var _studentAnswers = [];

function parseAssessmentResult(result){
  _assessmentResult = JSON.parse(result);
}

function checkAnswer(){
  if(_selectedAnswerIds !== null){
    return Assessment.checkAnswer(_items[_itemIndex], _selectedAnswerIds);
  } else{ 
    return null;
  }
}

function selectAnswer(item){
  //console.log("stores/assessment:47",SettingsStore.current());
  if(_items[_itemIndex].question_type == "multiple_choice_question"){
    _selectedAnswerIds = item.id;
  } else if (_items[_itemIndex].question_type == "multiple_answers_question"){
    if(_selectedAnswerIds.indexOf(item.id) > -1){
      _selectedAnswerIds.splice(_selectedAnswerIds.indexOf(item.id), 1);
    } else {
    _selectedAnswerIds.push(item.id);
    }
  } else if (_items[_itemIndex].question_type == "matching_question"){
    updateMatchingAnswer(item);
  } else if (_items[_itemIndex].question_type == "short_answer_question") {
	  //Put the value passed in from the textbox (item) as our only answer choice in the question (_items[_itemIndex]), and set selected answer id to 0 so we'll check if what they typed matches the correct answer.
	  _items[_itemIndex].answers = [{"material":item}];
	  //_selectedAnswerIds = 0;
	  _selectedAnswerIds = item;
	  //console.log("stores/assessment.js 61");
  } else if (_items[_itemIndex].question_type == "essay_question") {
	  _items[_itemIndex].answers = [{"material":item}];
	  //_selectedAnswerIds = 0;
	  //console.log("stores/assessment.js:69 textarea answer selected",item);
	  _selectedAnswerIds = item;
  }
}

function selectQuestion(index) {
    //console.log("stores/assessment:75 selecting question "+index, _items, _itemIndex);
    _items[_itemIndex].timeSpent += calculateTime(_items[_itemIndex].startTime, Utils.currentTime()); 
    _studentAnswers[_itemIndex] = {"answer":_selectedAnswerIds,"correct":checkAnswer().correct};
    _itemIndex = index;
    _items[_itemIndex].startTime = Utils.currentTime();
    _selectedAnswerIds = _studentAnswers[_itemIndex]["answer"];
    _answerMessageIndex = -1;
    _answerMessageFeedback  = "";
}

function loadOutcomes(assessment){
  var outcomes = assessment.sections.map((section)=>{
    if(section.outcome != "root section"){
      return section.outcome;
    }
  });
  outcomes = _.drop(outcomes);
  return outcomes;
}

function updateMatchingAnswer(item){
  for (var i = 0; i < _selectedAnswerIds.length; i++){
    if(_selectedAnswerIds[i] && _selectedAnswerIds[i].answerNumber == item.answerNumber){
      _selectedAnswerIds[i] = item;
      return;
    }
  }
  var index = parseInt(item.answerNumber.replace("answer-", ""));

 _selectedAnswerIds[index] = item;

}

function setUpStudentAnswers(numOfQuestions){
  for (var i = 0; i < numOfQuestions; i++){
    _studentAnswers[i] = {"answer":"","correct":false};
  }
}

function calculateTime(start, end){
  return end - start;
};

function getItems(sections, perSec){
  var items = []
  if(!perSec || perSec <= 0){
    return sections[0].items
  } 
  for(var i=1; i<sections.length; i++){
    var count = perSec > sections[i].items.length ? sections[i].items.length : perSec;
    for(var j=0; j < count; j++){
      var item = _.sample(sections[i].items);
      for(var k=0; k<items.length; k++){
        if(item.id == items[k].id){
          j--; 
          item=-1;
          break;
        }
      }
      if(item == -1) continue;

      items.push(item);
    }
  }
  return items;
}

function checkCompletion(){
  var questionsNotAnswered = [];
  for (var i = 0; i < _studentAnswers.length; i++) {
    if(_studentAnswers[i]["answer"] == null || _studentAnswers[i]["answer"].length == 0){
      
      questionsNotAnswered.push(i+1);
    }
  };
  if(questionsNotAnswered.length > 0){
    return questionsNotAnswered;
  }
  return true;
}

// Extend User Store with EventEmitter to add eventing capabilities
var AssessmentStore = assign({}, StoreCommon, {

  current(){
    return _assessment;
  },

  assessmentResult(){
    return _assessmentResult;
  },

  isReady(){
    return _assessmentState >= READY;
  },

  isLoaded(){
    return _assessmentState >= LOADED;
  },

  isStarted(){
    return _assessmentState >= STARTED;
  },

  isLoading(){
    return _assessmentState == LOADING;
  },

  currentQuestion(){
    return _items[_itemIndex] || {};
  },

  currentIndex(){
    return _itemIndex;
  },

  questionCount(){
    return _items.length;
  },

  selectedAnswerId(){
    return _selectedAnswerIds;
  },

  answerMessageIndex(){
    return _answerMessageIndex;
  },

  answerMessageFeedback(){
    return _answerMessageFeedback;
  },

  studentAnswers(){
    return _studentAnswers[_itemIndex];
  },

  allStudentAnswers(){
    return _studentAnswers;
  },

  allQuestions(){
    return _items;
  },

  startTime(){
    return _startedAt;
  },

  outcomes(){
    return _outcomes;
  },

  timeSpent(){
    var time = _finishedAt - _startedAt;
    var minutes = Math.floor(time/1000/60);
    time -= minutes*1000*60
    var seconds = Math.floor(time/1000);
    return {
      minutes: minutes,
      seconds: seconds
    }
  },

});

// Register callback with Dispatcher
Dispatcher.register(function(payload) {
  var action = payload.action;

  switch(action){

    case Constants.ASSESSMENT_LOAD_PENDING:
      _assessmentState = LOADING;
      break;

    case Constants.ASSESSMENT_LOADED:

      _assessmentState = INVALID;
      if(payload.data.text){
        var text = payload.data.text.trim();
        if(text.length > 0){
          _assessment = Assessment.parseAssessment(SettingsStore.current(), text);
          _assessmentXml = text;
          if( _assessment && 
              _assessment.sections && 
              _assessment.sections[_sectionIndex] &&
              _assessment.sections[_sectionIndex].items){
            if(_assessment.standard == "qti"){
              _items = getItems(_assessment.sections, SettingsStore.current().perSec);
            } else {
              _items = _assessment.sections[_sectionIndex].items
            }
            _outcomes = loadOutcomes(_assessment);
            setUpStudentAnswers(_items.length)
          }
          _assessmentState = LOADED;
          if(!_startedAt && !SettingsStore.current().enableStart){
            _assessmentState = STARTED;
            // set the start time for the assessment and the first question (only qti)
            if(_items[0])
            _items[0].startTime = Utils.currentTime()
            _startedAt = Utils.currentTime();
          }
	  // Go to focus question for visualization launches
	  //console.log("stores/assessment:278 selecting focus question", SettingsStore.current());
	  // Minus 1 since human-normal question number is passed in
	  selectQuestion(SettingsStore.current().questionFocus - 1);
        }
      }
      break;

    case Constants.ASSESSMENT_CHECK_ANSWER:
      //console.log("store/assessment:248 checking answer");
      var answer = checkAnswer();
      if(answer != null && answer.correct) {
        _answerMessageIndex = 1;
	_answerMessageFeedback = answer.feedbacks;
      } else if (answer != null && !answer.correct) {
        _answerMessageIndex = 0;
	_answerMessageFeedback = answer.feedbacks;
      }
      break;
    
    case Constants.ASSESSMENT_CHECK_ANSWER_REMOTELY:
      _studentAnswers[_itemIndex] = {"answer":_selectedAnswerIds,"correct":checkAnswer().correct};
      // show spinner
      _answerMessageIndex = "loading";
      break;

    case Constants.ASSESSMENT_ANSWER_REMOTELY_CHECKED:
      //console.log("store/assessment:274 question graded",JSON.parse(payload.data.text));
      var result = JSON.parse(payload.data.text);
      //console.log("stores/assessment:284 want to ensure question is the same",result.question_id,_itemIndex,_items[_itemIndex].id);
      if (result.error == null && result.correct != null) {
	      // Ensure that we received a result for the question that we're still displaying
	      if (result.question_id==_items[_itemIndex].id) {
		      if(result.correct) {
			_answerMessageIndex = 1;
			_answerMessageFeedback = result.feedback;
		      } else {
			_answerMessageIndex = 0;
			_answerMessageFeedback = result.feedback;
		      }
		      // Send xapi question answered statement here
		      var statementBody = {"confidenceLevel":result.confidence_level,"questionId":_itemIndex,"correct":result.correct,"questionType":_items[_itemIndex].question_type}
		      statementBody["duration"] = Utils.centisecsToISODuration(Math.round( (Utils.currentTime() - _items[_itemIndex].startTime) / 10) );
		      if (_items[_itemIndex].question_type == "essay_question" || _items[_itemIndex].question_type == "short_answer_question") {
			statementBody["answerGiven"] = (_studentAnswers[_itemIndex]["answer"] != null) ? _studentAnswers[_itemIndex]["answer"].trim() : "";
		      } else {
			statementBody["answerGiven"] = _selectedAnswerIds;
			for (var i=0; i<_items[_itemIndex].answers.length; i++) {
				if (_items[_itemIndex].answers[i].id == _selectedAnswerIds) {
					statementBody["answerGiven"] = _items[_itemIndex].answers[i].material.trim();
					break;
				}
			}
		      }
		      //console.log("stores/assessment:339 sending question answered",statementBody);
		      setTimeout(function() { XapiActions.sendQuestionAnsweredStatement(statementBody); }, 1);
	      } else {
		      //User must have navigated to a different question before check finished, so ignore this
		      //console.log("stores/assessment:313 answer check ignored; different question");
	      }
      } else {
	      // TODO something in case of an error checking question
	      _answerMessageIndex = "error";
      }
      break;

    case Constants.ASSESSMENT_START:
      if(!_startedAt){
        // set the start time for the assessment and the first question
        _items[0].startTime = Utils.currentTime()
        _startedAt = Utils.currentTime();
      }
      _assessmentState = STARTED;
      break;

    case Constants.ASSESSMENT_VIEWED:
      if(payload.data.text && payload.data.text.length > 0){
        _assessmentResult = parseAssessmentResult(payload.data.text);
        _assessmentState = READY;
      }
      break;

    case Constants.ASSESSMENT_NEXT_QUESTION:
      // Will need to advance sections and items.
      if(_itemIndex < _items.length - 1){
        _items[_itemIndex].timeSpent += calculateTime(_items[_itemIndex].startTime, Utils.currentTime()); 
	_studentAnswers[_itemIndex] = {"answer":_selectedAnswerIds,"correct":checkAnswer().correct};
        _itemIndex++;
        _items[_itemIndex].startTime = Utils.currentTime();
        _selectedAnswerIds = _studentAnswers[_itemIndex]["answer"];
        _answerMessageIndex = -1;  
	_answerMessageFeedback  = "";
      } 
      break;

    case Constants.ASSESSMENT_PREVIOUS_QUESTION:
      if(_itemIndex > 0){
        _items[_itemIndex].timeSpent += calculateTime(_items[_itemIndex].startTime, Utils.currentTime());
	_studentAnswers[_itemIndex] = {"answer":_selectedAnswerIds,"correct":checkAnswer().correct};
        _itemIndex--;
        _items[_itemIndex].startTime = Utils.currentTime();
        _selectedAnswerIds = _studentAnswers[_itemIndex]["answer"];
        _answerMessageIndex = -1;
	_answerMessageFeedback  = "";
      }
      break;

    case Constants.ANSWER_SELECTED:
      selectAnswer(payload.item);
      break;

    case Constants.EDX_LOAD_SECTION:
      if(_assessment){
        //EdX.findAndSetObject(_assessment.sections, payload.item);
      }
      break;

    case Constants.EDX_LOAD_ITEM:
        _items.push(payload.item);
      break;

    case Constants.ASSESSMENT_GRADED:
      parseAssessmentResult(payload.data.text);
      //console.log("stores/assessment:316 assessment graded");
      var correct_list = _assessmentResult.correct_list;
      var numCorrect = 0;
      var numTotal = correct_list.length;
      var complete = checkCompletion();
      for (var i=0; i<numTotal; i++) {
	      if (correct_list[i] == true) {
		      numCorrect++;
	      }
      }
      var statementBody = {};
      statementBody.duration = Utils.centisecsToISODuration(Math.round( (Utils.currentTime() - _startedAt) /10 ));
      statementBody.scaledScore = numCorrect / numTotal;
      statementBody.questionsTotal = numTotal;
      statementBody.questionsAnswered = (complete == true) ? numTotal : numTotal - complete.length;
      statementBody.questionsCorrect = numCorrect;
      //console.log("store/assessment:345 statement body",statementBody);
      setTimeout(function() { XapiActions.sendAssessmentCompletedStatement(statementBody); }, 1);
      break;
    case Constants.ASSESSMENT_SUBMITTED:
      _items[_itemIndex].timeSpent += calculateTime(_items[_itemIndex].startTime, Utils.currentTime());
      _finishedAt = Utils.currentTime(); 
      break;
      
    case Constants.LEVEL_SELECTED:
      _items[_itemIndex].confidenceLevel = payload.level;
      // if(payload.index ==  _items.length - 1){
        _studentAnswers[_itemIndex] = {"answer":_selectedAnswerIds,"correct":checkAnswer().correct};
      // }
      // if(SettingsStore.current().kind == "formative"){
      //   var answer = checkAnswer();
      //   if(answer != null && answer.correct)
      //     _answerMessageIndex = 1;
      //   else if (answer != null && !answer.correct)
      //     _answerMessageIndex = 0;
      // }
      //We have to do send the xapi statement in this icky place instead of in item.jsx on the confidence button click handler because this statement needs to know the result of checkAnswer. The confidence button does call that, but it sends a dispatch, which won't necessarily be finished in time.
      var statementBody = {"confidenceLevel":payload.level,"questionId":_itemIndex,"correct":_studentAnswers[_itemIndex].correct,"questionType":_items[_itemIndex].question_type}
      statementBody["duration"] = Utils.centisecsToISODuration(Math.round( (Utils.currentTime() - _items[_itemIndex].startTime) / 10) );
      if (_items[_itemIndex].question_type == "essay_question" || _items[_itemIndex].question_type == "short_answer_question") {
	statementBody["answerGiven"] = (_items[_itemIndex].answers[_selectedAnswerIds] != null) ? _items[_itemIndex].answers[_selectedAnswerIds].material.trim() : "";
      } else {
	statementBody["answerGiven"] = _selectedAnswerIds;
	for (var i=0; i<_items[_itemIndex].answers.length; i++) {
		if (_items[_itemIndex].answers[i].id == _selectedAnswerIds) {
			statementBody["answerGiven"] = _items[_itemIndex].answers[i].material.trim();
			break;
		}
	}
      }
      //console.log("stores/assessment:339 sending question answered",statementBody);
      //setTimeout(function() { XapiActions.sendQuestionAnsweredStatement(statementBody); }, 1);
      break;
    case Constants.QUESTION_SELECTED:
    	selectQuestion(payload.index);
      break;
    case Constants.RETAKE_ASSESSMENT:
      _assessmentResult = null;
      _studentAnswers = [];
      _itemIndex = 0;
      _sectionIndex = 0;
      _selectedAnswerIds = [];
      for(var i=0; i<_items.length; i++){
        _items[i].confidenceLevel = null;
      }
      break;
    default:
      return true;
  }

  // If action was responded to, emit change event
  AssessmentStore.emitChange();

  return true;

});


export default AssessmentStore;

