"use strict";

import React              from 'react';
import AssessmentActions  from "../../actions/assessment";
import AssessmentStore    from "../../stores/assessment";
import BaseComponent      from "../base_component";
export default class ProgressDropdown extends BaseComponent{
  
  constructor(props, context){
    super(props, context);
    this._bind("navButtonClicked");

  }

  navButtonClicked(){
    if(this.state && this.state.expanded){
      this.setState({expanded: !this.state.expanded})
    } else {
      this.setState({expanded: true});
    }
    
  }

  selectQuestion(e,index){
    console.log(index);
  }

  mouseOver(e){
    console.log(e)
    e.target.style.backgroundColor = "grey";
    e.target.style.color = "white";
  }

  mouseOut(e){
    console.log(e)
    e.target.style.backgroundColor = "white";
    e.target.style.color = "black";
  }

  getStyles(theme, expanded){
    return {
      dropdownStyle: {
        overflow: expanded ? "scroll" : "hidden",
        height: expanded ? "228px" : "0px",
        backgroundColor: "white",
        transition: "all 0.4s",
        boxShadow: expanded ? theme.progressDropdownBoxShadow : "",
        position: "absolute",
        top: "63px",
        left: "82px",
        width: "calc(100% - 102px)",
        zIndex: "10",
        listStyleType: "none"
      },
      dropdownButton: {
        width: "calc(100% - 62px)",
        textAlign: "start",
        padding: "5px",
        dislpay: "inline-block",
        marginLeft: "10px",
        backgroundColor: "white !important",
        borderRadius: "0px",
        boxShadow: theme.progressDropdownBoxShadow,
      },
      caret: {
        float: "right"
      },
      container: {
        display: "inline-block",
      },    
      icon: {
        height: "52px",
        width: "52px",
        dislay: "inline-block"
      },
      li: {
        borderBottom: "1px solid grey",
        padding: "10px",
        cursor: "pointer",
        zIndex: "10"
      }

    }
  }
  render(){
    var expanded = (this.state && this.state.expanded);
    var styles = this.getStyles(this.context.theme, expanded);
    var questions = this.props.questions.map((question, index)=>{
      return(  
              <div style={styles.li} key={"li" + index} onClick={(e)=>{this.selectQuestion(e,index)}} >
                <h5>Question {index + 1}</h5>
                <span>{question.material}</span>
              </div>)
    })
    return (
      <span >
        <img style={styles.icon}src={require("../../../../app/assets/fonts/ProgressIcon.svg")} />
        <button style={styles.dropdownButton} className="btn" type="button" aria-haspopup="true" aria-expanded="true" onClick={()=>{this.navButtonClicked()}} >
          <div>Progress</div>
          <span><b>You are on question {this.props.currentQuestion} of {this.props.questionCount}</b></span>
          <span style={styles.caret} className="caret"></span>
        </button>
        <div style={styles.dropdownStyle} aria-labelledby="dropdownMenu1">
          {questions}
        </div>
      </span>
    );
  }
}

ProgressDropdown.propTypes = { 

};

ProgressDropdown.contextTypes = {
  theme: React.PropTypes.object
}