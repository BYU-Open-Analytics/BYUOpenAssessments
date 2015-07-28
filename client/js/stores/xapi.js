"use strict";

import Dispatcher     from "../dispatcher";
import Constants      from "../constants";
import StoreCommon    from "./store_common";
import assign         from "object-assign";
import Api            from "../actions/api";

var _statements = [];
var _lastFlushTime = 0;
// Time to wait between queue flushes, in ms
var _waitTime = 4000;

// Send all statements in the queue
function flushQueue(forcibly){
	// Have a buffer window before flushing queue again, unless forcibly == true (used when submitting assessment and we want all statements absolutely sent)
	if (Date.now() - _lastFlushTime > _waitTime || forcibly == true) {
		//console.log("stores/xapi:14 flushing queue, forcibly: "+forcibly,_statements);
		// Put the current time in the url so that if this request hasn't finished before the queue is flushed again, it won't get cancelled (since this Api.request code cancels pending requests with the same url).
		Api.post(Constants.FLUSH_STATEMENT_QUEUE, "api/xapi?"+Date.now(), {"statements":_statements});
		_lastFlushTime = Date.now();
		_statements = [];
		return true;
	}
	//console.log("stores/xapi:25 queue not flushed.");
	return false;
}

// Add a statement to the queue
function enqueueStatement(statement){
	_statements.push(statement);
	//console.log("stores/xapi:25 current queue",_statements);
}

// Extend Xapi Store with EventEmitter to add eventing capabilities
var XapiStore = assign({}, StoreCommon, {

  // Return current statement queue
  currentStatementQueue(){
    return _statements;
  }

});

// Register callback with Dispatcher
Dispatcher.register(function(payload) {
  var action = payload.action;

  //console.log("stores/xapi:43",payload);

  switch(action){
    case Constants.FLUSH_STATEMENT_QUEUE:
    	flushQueue(payload.forcibly);
	break;

    case Constants.ENQUEUE_STATEMENT:
	enqueueStatement(payload.statement);
	break;

    default:
      return true;
  }

  // If action was responded to, emit change event
  XapiStore.emitChange();

  return true;

});

export default XapiStore;

