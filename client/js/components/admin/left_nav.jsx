"use strict";

import React                from "react";
import UserStore            from "../../stores/user";
import BaseComponent        from "../base_component";
import Router               from "react-router";
import Defines              from "../defines";
import AccountSelection     from './account_selection';
import { LeftNav, IconButton, FontIcon, FlatButton }          from "material-ui";

class LeftNavigation extends BaseComponent {

  constructor(props, context) {
    super(props, context);

    this.stores = [UserStore];
    this.state = this.getState();

    this._bind("_getSelectedIndex", "toggle", "_onLeftNavChange");
    this.selectedIndex = null;
  }

  getState(){
    var loggedIn = UserStore.loggedIn();

    var menuItems = [
      // { route: 'home', text: 'Home' }
    ];

    if(loggedIn){
      menuItems.push({ route: 'account', text:<div><i style={this.getStyles().iconStyle} className="material-icons">dashboard</i>Dashboard</div>  });
      menuItems.push({ route: 'users', text: <div><i style={this.getStyles().iconStyle} className="material-icons">account_circle</i>Users</div> });
      menuItems.push({ route: '', text: <div><i style={this.getStyles().iconStyle} className="material-icons">done</i>Assessments</div> });
      menuItems.push({ route: 'logout', text: <div><i style={this.getStyles().iconStyle} className="material-icons">exit_to_app</i>Logout</div> });
    } else {
      menuItems.push({ route: 'login', text: 'Sign In' });
    }

    return {
      menuItems: menuItems
    };
  }

  _getSelectedIndex() {
    var currentItem;

    for (var i = this.state.menuItems.length - 1; i >= 0; i--) {
      currentItem = this.state.menuItems[i];
      if (currentItem.route && this.context.router.isActive(currentItem.route)) return i;
    }
  }

  toggle() {
    this.refs.leftNav.toggle();
  }

  _onLeftNavChange(e, key, payload) {
    this.context.router.transitionTo(payload.route);
  }

  getStyles() {
    return {
      headerStyle: {
        backgroundColor: Defines.colors.grey,
        cursor: "pointer",
        fontSize: "24px",
        color: Defines.colors.white,
        paddingTop: "8px",
        marginBottom: "-6px",
        textColor: Defines.colors.white
      },
      iconStyle: {
        marginRight: "34px",
        verticalAlign: "middle",
        color: Defines.colors.darkGrey
      }
    };
  }

  render() {

    var styles = this.getStyles();

    var header = 
      <div style={styles.headerStyle}>
        <AccountSelection />
      </div>;

    return (
      <LeftNav
        ref="leftNav"
        docked={false}
        isInitiallyOpen={false}
        header={header}
        menuItems={this.state.menuItems}
        selectedIndex={this._getSelectedIndex()}
        onChange={(e, key, payload) => this._onLeftNavChange(e, key, payload)} />
    );
  }

}

LeftNavigation.contextTypes = {
  router: React.PropTypes.func.isRequired,
  muiTheme: React.PropTypes.object
};

module.exports = LeftNavigation;
