"use strict";

var React     = require('react');
var invariant = require('react/lib/invariant');

var AsyncStateMixin = {

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
    if (window.__reactAsyncStatePacket === undefined) {
      this.getStateAsync(function(err, state) {
        if (err) throw err;
        this.setState(state);
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
    'ReactAsync.createClass(...): Class specification must implement a `getStateAsync` method.' +
    'Otherwise you should use React.createClass(...).'
  );

  var render = spec.render;

  spec.render = function() {
    if (window.__reactAsyncStatePacket !== undefined) {
      var state = window.__reactAsyncStatePacket[this._rootNodeID];
      for (var k in state)
        this.state[k] = state[k];
    }
    return render.call(this);
  }

  spec.mixins = spec.mixins || [];
  spec.mixins.push(AsyncStateMixin);

  return React.createClass(spec);
}

module.exports = {createClass: createClass};
