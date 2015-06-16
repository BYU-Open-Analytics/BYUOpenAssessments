"use strict";

import React            from "react";
import AccountsStore    from "../../stores/accounts";
import BaseComponent    from "../base_component";
import AdminActions     from "../../actions/admin";
import Defines          from "../defines";
import { Link }         from "react-router";
import { FloatingActionButton } from "material-ui";
import ToolBar          from "./tool_bar";

class AccountsList extends BaseComponent {

  constructor(props, context){
    super(props, context);
    this._bind("getState");
    this.stores = [AccountsStore];
    this.state = this.getState();
  }

  getState(){
    return {
      accounts: AccountsStore.current()
    };
  }

  // There is a better way to do this.
  handleClick(e, key, payload){
    // pass the click event to the Link tag 
    this.refs[payload.ref].handleClick(e);
  }

  getStyles(){
    return {
      container: {
        margin          : "70px auto",
        overflow        : "auto",
        width           : "300px",
        minHeight       : "435px"
      },
      title: {
        fontSize   : "18pt",
        fontWeight : "400"
      },
      listContainer : {
        backgroundColor : Defines.colors.white
      },
      list : {
        width : "100%",
        margin : "0",
        padding : "0"
      },
      listItem : {
        fontSize     : "14pt",
        height       : "60px",
        paddingLeft  : "25px",
        width        : "100%",
        borderBottom : "solid 1px " + Defines.colors.lightGrey
      },
      listItemLink : {
        color        : Defines.colors.black,
        fontSize     : "14pt",
        verticalAlign: "middle",
        display      : "table-cell"
      },
      floatingActionButton : {
        float        : "right",
        position     : "relative",
        top          : "-20px",
        right        : "15px",
        zDepth       : 1
      }
    };
  }

  render(){

    var styles = this.getStyles();
    var accountList;

    if(this.state.accounts){
      
      var items = this.state.accounts.map((account) => {
        var param = {accountId: account.id};
        var ref = "linkTo" + account.id;
        return <li style={styles.listItem}>
            <Link ref={ref} style={styles.listItemLink} to="account" params={param}>{account.name}</Link>
          </li>;
      });

      accountList = <ul style={styles.list}>
        {items}
      </ul>;

    } else {
      accountList = <p>Loading</p>;
    }

    return(
      <div>
        <ToolBar />
        <div style={styles.container}>
          <h2 style={styles.title}>Choose Account</h2>
          <FloatingActionButton style={styles.floatingActionButton} iconClassName="material-icons-content-add" zDepth={1}/>
          <div style={styles.listContainer}>
            {accountList}
          </div>
        </div>
      </div>
  )

  }

}
module.exports = AccountsList;