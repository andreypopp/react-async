"use strict";

var React                   = require('react');
var invariant               = require('react/lib/invariant');
var BaseMixin               = require('./lib/BaseMixin');
var getComponentFingerprint = require('./lib/getComponentFingerprint');
var injectIntoMarkup        = require('./lib/injectIntoMarkup');

var Mixin = {
  mixins: [BaseMixin],

  getDefaultProps: function() {

    var Fiber;

    try {
      Fiber = require('fibers');
    } catch(err) {

    }

    if (Fiber === undefined || Fiber.current === undefined) {
      return {};
    }

    invariant(
      typeof this.getInitialStateAsync === 'function',
      this.displayName + ' component must implement a `getInitialStateAsync` method. ' +
      'Otherwise you should not use ReactAsync.Mixin'
    );

    var Future = require('fibers/future');

    var getInitialStateAsync = Future.wrap(this.getInitialStateAsync.bind(this));
    var asyncState = getInitialStateAsync().wait();
    var fingerprint = getComponentFingerprint(this);
    Fiber.current.__reactAsyncStatePacket[fingerprint] = asyncState;
    return {asyncState: asyncState};
  }
}

/**
 * Prefetch async state recursively and render component markup asynchronously.
 *
 * @param {ReactComponent} component
 * @param {Function<Error, String, Object>} cb
 */
function renderComponentToStringWithAsyncState(component, cb) {

  try {
    var Fiber = require('fibers');
  } catch (err) {
    console.error('install fibers: npm install fibers');
    throw err;
  }

  Fiber(function() { // jshint ignore:line
    try {
      Fiber.current.__reactAsyncStatePacket = {};

      var data = Fiber.current.__reactAsyncStatePacket;
      var markup = React.renderComponentToString(component);

      // Inject data if callback doesn't receive the data argument
      if (cb.length == 2) {
        markup = injectIntoMarkup(markup, data)
      }

      cb(null, markup, data);
    } catch(e) {
      cb(e)
    } finally {
      delete Fiber.current.__reactAsyncStatePacket;
    }
  }).run();
}

module.exports = {
  prefetchAsyncState: require('./lib/prefetchAsyncState'),
  isAsyncComponent: require('./lib/isAsyncComponent'),
  Mixin: Mixin,
  renderComponentToStringWithAsyncState: renderComponentToStringWithAsyncState,
  injectIntoMarkup: injectIntoMarkup
};
