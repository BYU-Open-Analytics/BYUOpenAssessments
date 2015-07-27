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

	//TODO add onpropertychange, or key event for ie, other browsers?
	//TODO Need to restore answer from studentAnswers (like in radio_button.jsx)?

	render(){
		return(
			<div>
				<textarea className="form-control" rows="4" onChange={this.onChange} onKeyup={this.onKeyup} onInput={this.onInput}></textarea>
			</div>
		);
	}
}
