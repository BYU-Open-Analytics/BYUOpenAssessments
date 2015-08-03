"use strict";

import React			from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";

export default class TextArea extends React.Component{
	
	onChange(e) {
		//console.log("text_area onchange",e.target.value);
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

      	render(){
		var styles = this.getStyles(this.props, this.context.theme)
		//console.log("text_area.jsx:26 rendering",this,AssessmentStore);
		var previousAnswer = (this.props.item.answers.length > 0 && this.props.item.answers[0].material != null) ? this.props.item.answers[0].material.trim() : "";
		var textArea = !this.props.isDisabled ? <textarea className="form-control" rows="4" onBlur={this.onChange}>{previousAnswer}</textarea> : <div style={styles.resultAnswer}>{previousAnswer}</div>;

		return(
			<div>
				{textArea}
			</div>
		);
	}
}
TextArea.propTypes = {
	item : React.PropTypes.object.isRequired,
	name: React.PropTypes.string.isRequired,
        isDisabled: React.PropTypes.bool
};

TextArea.contextTypes = {
  theme: React.PropTypes.object
}
