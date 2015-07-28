"use strict";

import React			from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class TextArea extends React.Component{
	
	onChange(e) {
		//console.log("text_area onchange",e.target.value);
		AssessmentActions.answerSelected(e.target.value);
	}
	onKeyup(e) {
		//console.log("text_area keyup",e.target.value);
		AssessmentActions.answerSelected(e.target.value);
	}
	onInput(e) {
		//console.log("text_area input",e.target.value);
		AssessmentActions.answerSelected(e.target.value);
	}


	render(){
		//console.log("text_area.jsx:26 rendering",this,AssessmentStore);
		var previousAnswer = (this.props.item.answers.length > 0 && this.props.item.answers[0].material != null) ? this.props.item.answers[0].material.trim() : "";
		return(
			<div>
				<textarea className="form-control" rows="4" onBlur={this.onChange}>{previousAnswer}</textarea>
			</div>
		);
	}
}
