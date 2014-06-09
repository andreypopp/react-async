"use strict";

var BaseMixin               = require('./lib/BaseMixin');
var Preloaded               = require('./lib/Preloaded');
var getComponentFingerprint = require('./lib/getComponentFingerprint');

var Mixin = {
  mixins: [BaseMixin],

  getDefaultProps: function() {
    if (window.__reactAsyncStatePacket === undefined) {
      return {};
    }

    var fingerprint = getComponentFingerprint(this);

    if (window.__reactAsyncStatePacket[fingerprint] === undefined) {
      return {};
    }

    var state = window.__reactAsyncStatePacket[fingerprint];
    delete window.__reactAsyncStatePacket[fingerprint];

    if (typeof this.stateFromJSON === 'function') {
      state = this.stateFromJSON(state);
    }

    return {asyncState: state};
  }
};

module.exports = {
  prefetchAsyncState: require('./lib/prefetchAsyncState'),
  isAsyncComponent: require('./lib/isAsyncComponent'),
  Mixin: Mixin,
  Preloaded: Preloaded
};
