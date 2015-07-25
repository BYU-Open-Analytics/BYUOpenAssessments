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
		console.log("text_field.jsx:16 rendering",this,AssessmentStore);
		var previousAnswer = (this.props.item.answers.length > 0 && this.props.item.answers[0].material != null) ? this.props.item.answers[0].material : "";
		return(
			<div>
				<input type="text" className="form-control" value={previousAnswer} onInput={this.onChange} onChange={this.onChange} onKeyup={this.onChange} />
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
