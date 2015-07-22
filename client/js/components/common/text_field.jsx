"use strict";

import React		  from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class TextField extends React.Component{

	onChange(e) {
		//console.log("text_field:16 change",e.target.value);
		AssessmentActions.answerSelected(e.target.value);
	}

	//TODO Need to restore answer from studentAnswers (like in radio_button.jsx)?
	render(){
		return(
			<div>
				<input type="text" className="form-control" onInput={this.onChange} />
			</div>
		);
	}
	//<input type="text" className="form-control" onInput={()=>{ this.answerSelected() }} />
}
TextField.propTypes = {
	item : React.PropTypes.object.isRequired,
	name: React.PropTypes.string.isRequired
};

TextField.contextTypes = {
  theme: React.PropTypes.object
}
