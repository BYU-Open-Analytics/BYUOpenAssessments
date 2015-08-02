"use strict";

import React              from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class RadioButton extends React.Component{
  
  answerSelected(){
	  //console.log("radio.jsx answer selected",this.props.item);
    AssessmentActions.answerSelected(this.props.item);
  }

  getStyles(props, theme){
    return {
      btnQuestion:{
        whiteSpace: theme.btnQuestionWhiteSpace,
        background: "transparent",//props.isDisabled? "transparent" : theme.btnQuestionBackground,
        color: theme.btnQuestionColor,
        textAlign: theme.btnQuestionTextAlign,
        padding: theme.btnQuestionPadding,
        marginBottom: theme.btnQuestionMarginBottom,
        display: theme.btnQuestionDisplay,
        width: theme.btnQuestionWidth,
        verticalAlign: theme.btnQuestionVerticalAlign,
        fontWeight: theme.btnQuestionFontWeight,
        touchAction: theme.btnQuestionTouchAction,
        cursor: theme.btnQuestionCursor,
        border: theme.btnQuestionBorder,
        fontSize: theme.btnQuestionFontSize,
        lineHeight: theme.btnQuestionLineHeight,
        borderRadius: theme.btnQuestionBorderRadius
      },

      radioText: {
        color: theme.radioTextColor,
        fontWeight: theme.radioTextFontWeight,
        marginLeft: theme.radioTextMarginLeft,
      }
    }
  }
  render(){
    console.log("radio)button:45 not setting checked properly this, assessmentstore",this,AssessmentStore,AssessmentStore.allStudentAnswers());
    var styles = this.getStyles(this.props, this.context.theme)
    var checked = null;
    if (this.props.question.question_index != null) {
	    //This is for assessment result screen, where just getting the current question's answer won't work (unless this happens to be the last question the user answered), so we need to manually pass in the question index to look up the answer
	    //console.log("radio:48 we have question id "+this.props.question.question_index,AssessmentStore.allStudentAnswers());
            checked = (this.props.item.id == AssessmentStore.allStudentAnswers()[this.props.question.question_index]["answer"]) ? "true" : null;
    } else {
	    checked = (this.props.item.id == AssessmentStore.studentAnswers()["answer"]) ? "true" : null;
    }
    console.log("checked: ",checked);
    var radio = !this.props.isDisabled ? <input type="radio" defaultChecked={checked} name={this.props.name} onClick={()=>{ this.answerSelected() }}/> : <b></b>;//<input type="radio" disabled="true" defaultChecked={checked} name={this.props.name} onClick={()=>{ this.answerSelected() }}/>;
    if (checked && this.props.isDisabled) {
	    styles.btnQuestion.border = "solid gray 1px";
    }
    return (
      
      <div className="btn btn-block btn-question" style={styles.btnQuestion}>
        <label>
          {radio}
          <span className="radio-text" style={styles.radioText}>{this.props.item.material}</span>
        </label>
      </div>
    );
  }
}

RadioButton.propTypes = { 
  item: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
  isDisabled: React.PropTypes.bool
};

RadioButton.contextTypes = {
  theme: React.PropTypes.object
}
