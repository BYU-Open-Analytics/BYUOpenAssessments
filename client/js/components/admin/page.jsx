"use strict";

import React                from "react";
import Messages             from "../common/messages";
import LeftNav              from "./left_nav";
import {RouteHandler}       from "react-router";

var mui = require('material-ui');
var Colors = mui.Styles.Colors;
var Typography = mui.Styles.Typography;
var ThemeManager = new mui.Styles.ThemeManager();
var { AppCanvas, AppBar, IconButton } = mui;

class Page extends React.Component {

  constructor() {
    super();
    this._onMenuIconButtonTouchTap = this._onMenuIconButtonTouchTap.bind(this);
  }

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  }

  _onMenuIconButtonTouchTap() {
    this.refs.leftNav.toggle();
  }

  render(){
    var title = "Admin";

    var githubButton = (
      <IconButton
        className="github-icon-button"
        iconClassName="muidocs-icon-custom-github"
        href="https://github.com/atomicjolt/byu_open_assessments"
        linkButton={true} />
    );

    return (
      <AppCanvas predefinedLayout={1}>

        <AppBar
          className="mui-dark-theme"
          onLeftIconButtonTouchTap={(e) => this._onMenuIconButtonTouchTap(e)}
          title={title}
          zDepth={1}>
          {githubButton}
        </AppBar>

        <LeftNav ref="leftNav" />

        <div className="mui-app-content-canvas page-with-nav">
          <Messages/>
          <div className="page-with-nav-content">
            <RouteHandler />
          </div>
        </div>
      </AppCanvas>

    );
  }
}

Page.contextTypes = {
  router: React.PropTypes.func
};

Page.childContextTypes = {
  muiTheme: React.PropTypes.object
};

module.exports = Page;
