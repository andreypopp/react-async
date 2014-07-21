"use strict";

var invariant               = require('react/lib/invariant');
var isAsyncComponent        = require('./lib/isAsyncComponent');
var Preloaded               = require('./lib/Preloaded');
var getComponentFingerprint = require('./lib/getComponentFingerprint');

var Mixin = {

  getInitialState: function() {
    if (this.props.asyncState) {
      return this.props.asyncState;
    }

    if (window.__reactAsyncStatePacket === undefined) {
      return {};
    }

    var fingerprint = getComponentFingerprint(this);

    if (window.__reactAsyncStatePacket[fingerprint] === undefined) {
      return {};
    }

    var asyncState = window.__reactAsyncStatePacket[fingerprint];
    delete window.__reactAsyncStatePacket[fingerprint];

    if (typeof this.stateFromJSON === 'function') {
      asyncState = this.stateFromJSON(asyncState);
    }

    return asyncState;
  },

  componentDidMount: function() {

    invariant(
      typeof this.getInitialStateAsync === 'function',
      "%s uses ReactAsync.Mixin and should provide getInitialStateAsync(cb) method",
      this.displayName
    );

    if (!this.props.asyncState) {
      this.getInitialStateAsync(this._onStateReady);
    }
  },

  _onStateReady: function(err, asyncState) {
    if (err) {
      throw err;
    }

    if (this.isMounted()) {
      this.setState(asyncState);
    }
  }
};

module.exports = {
  prefetchAsyncState: require('./lib/prefetchAsyncState'),
  isAsyncComponent: require('./lib/isAsyncComponent'),
  Mixin: Mixin,
  Preloaded: Preloaded
};
