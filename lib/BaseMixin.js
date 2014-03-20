"use strict";

var invariant         = require('react/lib/invariant');
var isAsyncComponent  = require('./isAsyncComponent');

/**
 * Mixin for asynchronous components.
 *
 * Asynchronous state is fetched via `getInitialStateAsync(cb)` method but also
 * can be injected via `asyncState` prop.
 *
 * In the latter case `getInitialStateAsync` won't be called at all.
 */
var BaseMixin = {

  getInitialState: function() {
    return this.props.asyncState || {};
  },

  componentDidMount: function() {

    invariant(
      isAsyncComponent(this),
      "%s uses ReactAsync.Mixin and should provide getInitialStateAsync(cb) method",
      this.displayName
    );

    if (!this.props.asyncState) {
      this.getInitialStateAsync(this._onStateReady);
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.asyncState) {
      this.setState(nextProps.asyncState);
    }
  },

  _onStateReady: function(err, state) {
    if (err) {
      throw err;
    }

    if (this.isMounted()) {
      this.setState(state);
    }
  }
};

module.exports = BaseMixin;
