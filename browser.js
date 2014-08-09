"use strict";

var invariant               = require('react/lib/invariant');
var Preloaded               = require('./lib/Preloaded');
var getComponentFingerprint = require('./lib/getComponentFingerprint');
var prefetchAsyncState      = require('./lib/prefetchAsyncState');
var isAsyncComponent        = require('./lib/isAsyncComponent');

var Mixin = {

  getInitialState: function() {
    if (this.props.asyncState) {
      return this.props.asyncState;
    }

    if (window.__reactAsyncStatePacket === undefined) {
      this._fetchAsyncState = true;
      return {};
    }

    var fingerprint = getComponentFingerprint(this);

    if (window.__reactAsyncStatePacket[fingerprint] === undefined) {
      this._fetchAsyncState = true;
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

    if (this._fetchAsyncState) {
      var cb = this._onStateReady;
      var promise = this.getInitialStateAsync(cb);

      if (promise && promise.then) {
        promise.then(cb.bind(this, null), cb);
      }
    }
  },

  componentWillUnmount: function() {
    delete this._fetchAsyncState;
  },

  _onStateReady: function(err, asyncState) {
    if (err) {
      throw err;
    }

    if (this.isMounted()) {
      this.setState(asyncState || {});
    }
  }
};

module.exports = {
  prefetchAsyncState: prefetchAsyncState,
  isAsyncComponent: isAsyncComponent,
  Mixin: Mixin,
  Preloaded: Preloaded
};
