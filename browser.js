"use strict";

var React                   = require('react');
var invariant               = require('react/lib/invariant');
var getComponentFingerprint = require('./getComponentFingerprint');

var AsyncStateMixin = {

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
    if (window.__reactAsyncStatePacket === undefined) {
      this.getInitialStateAsync(function(err, state) {
        if (err) {
          throw err;
        }
        if (this.isMounted()) {
          this.setState(state);
        }
      }.bind(this));
    }
  }
};

function createClass(spec) {

  invariant(
    spec.render,
    'ReactAsync.createClass(...): Class specification must implement a `render` method.'
  );

  invariant(
    spec.render,
    'ReactAsync.createClass(...): Class specification must implement a `getInitialStateAsync` method.' +
    'Otherwise you should use React.createClass(...).'
  );

  var render = spec.render;

  spec.render = function() {
    if (window.__reactAsyncStatePacket !== undefined) {
      var state = window.__reactAsyncStatePacket[getComponentFingerprint(this)];
      for (var k in state)
        this.state[k] = state[k];
    }
    return render.call(this);
  }

  spec.mixins = spec.mixins || [];
  spec.mixins.push(AsyncStateMixin);

  return React.createClass(spec);
}

function renderComponent(component, element) {
  component = React.renderComponent(component, element);

  // invalidate data after first render
  if (window.__reactAsyncStatePacket !== undefined) {
    window.__reactAsyncStatePacket = undefined;
  }

  return component;
}

module.exports = {
  createClass: createClass,
  renderComponent: renderComponent
};
