import $   from 'jquery';
import _   from 'lodash';

export default class Qti{

  static parseSections(xml){

    var fromXml = (xml) => {
      xml = $(xml);
      return {
        id       : xml.attr('ident'),
        standard : 'qti',
        xml      : xml,
        items    : this.parseItems(xml)
      };
    };

    // Not all QTI files have sections. If we don't find one we build a default one to contain the items from the QTI file.
    var buildDefault = (xml) => {
      return {
        id       : 'default',
        standard : 'qti',
        xml      : xml,
        items    : this.parseItems(xml)
      };
    };

    return this.listFromXml(xml, 'section', fromXml, buildDefault);

  }

  static parseItems(xml){

    var fromXml = (xml) => {
      xml = $(xml);

      var objectives = xml.find('objectives matref').map((index, item) => { 
        return $(item).attr('linkrefid'); 
      });

      var item = {
        id         : xml.attr('ident'),
        title      : xml.attr('title'),
        objectives : objectives,
        xml        : xml,
        material   : this.material(xml),
        answers    : this.parseAnswers(xml),
        correct    : this.parseCorrect(xml),
	feedbacks  : this.parseFeedback(xml),
        timeSpent  : 0
      };

      $.each(xml.find('itemmetadata > qtimetadata > qtimetadatafield'), function(i, x){
        item[$(x).find('fieldlabel').text()] = $(x).find('fieldentry').text();
      });

      if(xml.find('itemmetadata > qmd_itemtype').text() === 'Multiple Choice'){
        item.question_type = 'multiple_choice_question';
      }

      var response_grp = xml.find('response_grp');
      if(response_grp){
        if(response_grp.attr('rcardinality') === 'Multiple'){
          item.question_type = 'drag_and_drop';
        }
      }

      return item;
    };

    return this.listFromXml(xml, 'item', fromXml);
  
  }

  static parseCorrect(xml){
    var respconditions = xml.find("respcondition");
    //console.log("models/qti:76 respconditions",respconditions)
    var correctAnswers = []
    for (var i=0; i<respconditions.length; i++){
      var condition = $(respconditions[i]);
      //console.log(condition.attr("continue"));
      if(condition.find('setvar').text() != '0'){
	//Get feedback for a specific answer, if there is any
	var feedback = "";
	if (condition.find("displayfeedback").length > 0) {
		feedback = xml.find("itemfeedback[ident='"+$(condition.find("displayfeedback")[0]).attr("linkrefid")+"']").text();
	}
	var varequals = condition.find('conditionvar > varequal');
	//Add an answer for each individual varequal, since for short answer questions, all correct answers are grouped in a single respcondition > conditionvar
	for (var j=0; j<varequals.length; j++) {
		var varequal = $(varequals[j]);
		var answer = {
		  id: varequal.text(),
		  value: condition.find('setvar').text(),
		  feedback: feedback
		}
		if(answer.id == ""){
		  answer.id = condition.find('conditionvar > and > varequal').map((index, condition) => {
		    condition = $(condition);
		    return condition.text();
		  });
		  answer.id = answer.id.toArray();
		}
		correctAnswers.push(answer);
	}
      }
    }
    return correctAnswers;
  }

  static parseAnswers(xml){

    var fromXml = (xml) => {
      xml = $(xml);
      var matchMaterial = xml.parent().parent().find('material')[0].textContent.trim();
      var answer = {
        id       : xml.attr('ident'),
        material : this.buildMaterial(xml.find('material').children()),
        matchMaterial: matchMaterial, 
        xml      : xml
      };
      return answer;
    };

    return this.listFromXml(xml, 'response_lid > render_choice > response_label', fromXml);

  }

  static parseFeedback(xml) {
	//Extract general_fb and general_incorrect_fb
	//console.log("qti:131 parse feedback");
	var serializer = new XMLSerializer();
	//console.log(serializer.serializeToString(xml.get(0)));
	var correct_feedback = xml.find("itemfeedback[ident='general_fb']").text() || "";
	var incorrect_feedback = xml.find("itemfeedback[ident='general_incorrect_fb']").text() || "";
	//console.log(correct_feedback,incorrect_feedback);
	return { correct: correct_feedback, incorrect: incorrect_feedback };
  }

  // Process nodes based on QTI spec here:
  // http://www.imsglobal.org/question/qtiv1p2/imsqti_litev1p2.html#1404782
  static buildMaterial(nodes){
    var result = '';
    $.each(nodes, function(i, item){
      var parsedItem = $(item);
      switch(item.nodeName.toLowerCase()){
        case 'mattext':
          // TODO both mattext and matemtext have a number of attributes that can be used to display the contents
          result += parsedItem.text();
          break;
        case 'matemtext':
          // TODO figure out how to 'emphasize' text
          result += parsedItem.text();
          break;
        case 'matimage':
          result += '<img src="' + parsedItem.attr('uri') + '"';
          if(parsedItem.attr('label')) { result += 'alt="' + parsedItem.attr('label') + '"';   }
          if(parsedItem.attr('width')) { result += 'width="' + parsedItem.attr('width') + '"'; }
          if(parsedItem.attr('height')){ result += 'height="' + parsedItem.attr('height') + '"'; }
          result += ' />';
          break;
        case 'matref':
          var linkrefid = $(item).attr('linkrefid');
          // TODO figure out how to look up material based on linkrefid
          break;
      }
    });

    return result;
  }

  static listFromXml(xml, selector, fromXml, buildDefault){
    xml = $(xml);
    var list = xml.find(selector).map((i, x) => {
      return fromXml(x);
    }).toArray(); // Make sure we have a normal javascript array not a jquery array.
    if(list.length <= 0 && buildDefault){
      list = [buildDefault(xml)];
    }
    return list;
  }

  // //////////////////////////////////////////////////////////
  // Item related functionality
  //
  static buildResponseGroup(node){
    // TODO this is an incomplete attempt to build a drag and drop
    // question type based on the drag_and_drop.xml in seeds/qti
    return this.buildMaterial($(node).find('material').children());
  }

  static material(xml){
    
    var material = xml.find('presentation > material').children();
    if(material.length > 0){
      return Qti.buildMaterial(material);
    }

    var flow = xml.find('presentation > flow');
    if(flow.length > 0){
      return Qti.reduceFlow(flow);
    }

  }

  static reduceFlow(flow){
    var result = '';
    $.each(flow.children(), function(i, node){
      if(node.nodeName.toLowerCase() === 'flow'){
        result += Qti.buildMaterial($(node).find('material').children());
      } else if(node.nodeName.toLowerCase() === 'response_grp'){
        result += Qti.buildResponseGroup(node);
      }
    });
    return result;
  }

}
