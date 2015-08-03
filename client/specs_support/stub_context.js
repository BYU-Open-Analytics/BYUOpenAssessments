"use strict";

import React          from "react";
import assign         from "object-assign";
import StyleManager   from "../js/utils/theme_manager";

var { func } = React.PropTypes;

var mui = require('material-ui');
var ThemeManager = new mui.Styles.ThemeManager();
var Theme = new StyleManager();
export default (Component, props, stubs) => {

  function RouterStub(){ }

  assign(RouterStub, {
    makePath(){},
    makeHref(){},
    transitionTo(){},
    replaceWith(){},
    goBack(){},
    getCurrentPath(){},
    getCurrentRoutes(){},
    getCurrentPathname(){},
    getCurrentParams(){},
    getCurrentQuery(){},
    isActive(){},
    getRouteAtDepth(){},
    setRouteComponentAtDepth(){}
  }, stubs);

  class Stubber extends React.Component {

    getChildContext(){
      return {
        router: RouterStub,
        routeDepth: 0,
        muiTheme: ThemeManager.getCurrentTheme(),
        theme: Theme.current()
      };
    }

    // Use to get access to the component instance in case you need to spyOn a method of the component.
    originalComponent(){
      return this.refs.originalComponent;
    }

    render(){
      return <Component ref="originalComponent" {...props} />;
    }
  }

  Stubber.childContextTypes = {
    router: React.PropTypes.func,
    routeDepth: React.PropTypes.number,
    muiTheme: React.PropTypes.object,
    theme: React.PropTypes.object
  };

  return Stubber;

};


