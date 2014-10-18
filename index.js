"use strict";

var React                   = require('react');
var invariant               = require('react/lib/invariant');
var Preloaded               = require('./lib/Preloaded');
var getComponentFingerprint = require('./lib/getComponentFingerprint');
var injectIntoMarkup        = require('./lib/injectIntoMarkup');
var prefetchAsyncState      = require('./lib/prefetchAsyncState');
var isAsyncComponent        = require('./lib/isAsyncComponent');

var Mixin = {

  getInitialState: function() {
    if (this.props.asyncState) {
      return this.props.asyncState;
    }

    var Fiber;

    try {
      Fiber = require('fibers');
    } catch(err) {

    }

    if (Fiber === undefined ||
        Fiber.current === undefined ||
        Fiber.current.__reactAsyncStatePacket === undefined) {
      return {};
    }

    invariant(
      typeof this.getInitialStateAsync === 'function',
      this.displayName + ' component must implement a `getInitialStateAsync` method. ' +
      'Otherwise you should not use ReactAsync.Mixin'
    );

    var Future = require('fibers/future');

    var getInitialStateAsync = Future.wrap(function(cb) {
      var promise = this.getInitialStateAsync(cb);

      if (promise && typeof promise.then === 'function') {
        promise.then(cb.bind(cb, null), cb);
      } else if (promise === false) {
        cb(null);
      }
    }.bind(this));
    var asyncState = getInitialStateAsync().wait();
    var fingerprint = getComponentFingerprint(this);

    var storedAsyncState = asyncState;

    if (typeof this.stateToJSON === 'function') {
      storedAsyncState = this.stateToJSON(storedAsyncState);
    }

    Fiber.current.__reactAsyncStatePacket[fingerprint] = storedAsyncState;

    return asyncState || {};
  }
}

/**
 * Prefetch async state recursively and render component markup asynchronously.
 *
 * @param {ReactComponent} component
 * @param {Function<Error, String, Object>} cb
 */
function renderToStringAsync(component, cb) {

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
      var markup = React.renderToString(component);

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

var renderComponentToStringWithAsyncState_deprecationWarned = false;

function renderComponentToStringWithAsyncState(component, cb) {
  if (!renderComponentToStringWithAsyncState_deprecationWarned) {
    renderComponentToStringWithAsyncState_deprecationWarned = true;
    console.warn(
      'Warning: ReactAsync.renderComponentToStringWithAsyncState will be ' +
      'deprecated in a future version. Use ReactAsync.renderToStringAsync instead.'
    );
  }
  return renderToStringAsync(component, cb);
}

module.exports = {
  prefetchAsyncState: prefetchAsyncState,
  isAsyncComponent: isAsyncComponent,
  Mixin: Mixin,
  Preloaded: Preloaded,
  renderComponentToStringWithAsyncState: renderComponentToStringWithAsyncState,
  renderToStringAsync: renderToStringAsync,
  injectIntoMarkup: injectIntoMarkup
};
