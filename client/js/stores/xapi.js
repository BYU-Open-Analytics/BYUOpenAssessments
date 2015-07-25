"use strict";

import Dispatcher     from "../dispatcher";
import Constants      from "../constants";
import StoreCommon    from "./store_common";
import assign         from "object-assign";
import Api            from "../actions/api";

var _statements = [];
var _lastFlushTime = 0;

// Send all statements in the queue
function flushQueue(forcibly){
	// TODO have 2-3 second buffer window before flushing queue again, unless forcibly == true
	console.log("stores/xapi:14 flushing queue",_statements);
	// Put the current time in the url so that if this request hasn't finished before the queue is flushed again, it won't get cancelled (since this Api.request code cancels pending requests with the same url).
	Api.post(Constants.FLUSH_STATEMENT_QUEUE, "api/xapi?"+Date.now(), _statements);
	_lastFlushTime = Date.now();
	//_statements = [];
}

// Add a statement to the queue
function enqueueStatement(statement){
	console.log("stores/xapi:20 queueing statement",statement);
	_statements.append(statement);
	console.log("stores/xapi:25 current queue",_statements);
}

// Extend Xapi Store with EventEmitter to add eventing capabilities
var XapiStore = assign({}, StoreCommon, {

  // Return current user
  currentStatementQueue(){
    return _statements;
  }

});

// Register callback with Dispatcher
Dispatcher.register((payload) => {
  var action = payload.action;

  switch(action){
    case FLUSH_STATEMENT_QUEUE:
    	flushQueue(payload.forcibly);
	break;

    case ENQUEUE_STATEMENT:
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

