"use strict";

import React            from 'react';
import UniversalInput   from '../assessments/universal_input';
import ResultConfidence from '../common/result_confidence';
export default class ItemResult extends React.Component{
  
  getStyles(props, theme){
    var color;
    var border;
    if(props.isCorrect == "partial"){
      color = theme.partialBackgroundColor;
      border = theme.partialBorder;
    } else if (props.isCorrect == false){
      border = theme.incorrectBorder;
      color = theme.incorrectBackgroundColor;
    } else if (props.isCorrect){
      color = theme.correctBackgroundColor;
      border = theme.correctBorder
    }
    return {
      resultContainer: {
        backgroundColor: color,
        border: border,
        borderRadius : "4px",
        padding: "10px",
      },
      confidenceWrapper: {
        width: theme.confidenceWrapperWidth,
        height: theme.confidenceWrapperHeight,
        padding: theme.confidenceWrapperPadding,
        marginTop: "5px",
        backgroundColor: theme.confidenceWrapperBackgroundColor,
      },
      answerResult: {
        marginTop: "20px"
      }
    };
  }
  getFeedback(correct,feedback,styles){
    var result;

    if(correct == true) {
      result =  <div className="check_answer_result answer_result_correct" style={styles.answerResult}>
                  <p>Correct</p><div dangerouslySetInnerHTML={{__html: feedback}}></div>
                </div>;
    }
    else {
      result =  <div className="check_answer_result answer_result_incorrect" style={styles.answerResult}>
                  <p>Incorrect</p><div dangerouslySetInnerHTML={{__html: feedback}}></div>
                </div>;
    }

    return result;
  }

  render() {
    console.log(this.props.isCorrect)
    var styles = this.getStyles(this.props, this.context.theme)
    console.log("item_result:27 render",this.props);
    return (
      <div>
        <div className="row">
          <div className="col-md-9" style={styles.resultContainer}>
            <div dangerouslySetInnerHTML={{__html: this.props.question.material}}></div>
            <div>
              <UniversalInput item={this.props.question} isResult={true}/>
            </div>
	    {this.getFeedback(this.props.isCorrect,this.props.feedback,styles)}
            <div style={styles.confidenceWrapper}>
              <ResultConfidence level={this.props.confidence} />
            </div>
          </div>
          <div className="col-md-3"></div>
        </div> 
        <div className="row">
          
        </div>
        <hr />
      </div>
    );
  }

}

ItemResult.contextTypes = {
  theme: React.PropTypes.object
}

ItemResult.propTypes = {
  question: React.PropTypes.object.isRequired,
  confidence: React.PropTypes.string.isRequired,
  isCorrect: React.PropTypes.bool.isRequired
}
