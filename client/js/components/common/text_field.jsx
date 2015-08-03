"use strict";

import React		  from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class TextField extends React.Component{

	onChange(e) {
		//console.log("text_field:16 change",e.target.value);
		AssessmentActions.answerSelected(e.target.value);
	}
	
        getStyles(props, theme){
          return {
            resultAnswer:{
	      border: "solid gray 1px",
              borderRadius: theme.btnQuestionBorderRadius,
	      background: "rgba(255,255,255,0.5)",
	      padding: "10px"
	    }
	  }
	}

	//TODO add onpropertychange, or key event, at least blur? for old ie, other browsers?
	render(){
		var styles = this.getStyles(this.props, this.context.theme)
		//console.log("text_field.jsx:16 rendering",this,AssessmentStore);
		var previousAnswer = (this.props.item.answers.length > 0 && this.props.item.answers[0].material != null) ? this.props.item.answers[0].material : "";
		var textField = !this.props.isDisabled ? <input type="text" className="form-control" value={previousAnswer} onInput={this.onChange} onChange={this.onChange} onKeyup={this.onChange} /> : <div style={styles.resultAnswer}>{previousAnswer}</div>;
		return(
			<div>
				{textField}
			</div>
		);
	}
	//<input type="text" className="form-control" onInput={()=>{ this.answerSelected() }} />
}
TextField.propTypes = {
	item : React.PropTypes.object.isRequired,
	name: React.PropTypes.string.isRequired,
        isDisabled: React.PropTypes.bool
};

TextField.contextTypes = {
  theme: React.PropTypes.object
}
