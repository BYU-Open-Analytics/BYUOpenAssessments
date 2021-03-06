(function(){
  var iframe = document.getElementById('openassessments_container');

  if(!iframe){ return; }

  var Communicator = {
    enableListener: function(handler){
      // Create IE + others compatible event handler
      var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      var eventer = window[eventMethod];
      this.messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
      // Listen to message from child window
      eventer(this.messageEvent, handler.handleComm, false);
    },

    commMsg: function(msg, payload){
      iframe.contentWindow.postMessage({'open_assessments_msg': msg, 'payload': payload}, '*');
    }

  };

  var CommunicationHandler = {

    init: function(){
      Communicator.enableListener(this);
      Communicator.commMsg('open_assessments_size_request', {});
    },

    resizeIframe: function(payload){
      //iframe.style.width = payload.width + "px";
      iframe.style.height = payload.height + "px";
    },

    handleComm: function(e){
      switch(e.data.open_assessments_msg){
        case 'open_assessments_resize':
          CommunicationHandler.resizeIframe(e.data.payload);
          break;
      }
    }

  };

  CommunicationHandler.init();

})();