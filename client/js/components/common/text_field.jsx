"use strict";

import React		  from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class TextField extends React.Component{

  answerSelected(){
	  console.log("text_field.jsx:10 answer selected",this,this.props,this.props.item);
	  this.props.item.answers = [{"material":"salt lake city"}];
    AssessmentActions.answerSelected(this.props.item);
  }
	onChange(e) {
		console.log("text_field:16 change",e.target.value);
		//this.props.item.answers = [{"material":"salt lake city"}];
		AssessmentActions.answerSelected(e.target.value);
		//answerSelected(e.target.value);
	}

	render(){
		return(
			<div>
			  {this.props.item.material}
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
