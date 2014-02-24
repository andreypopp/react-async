"use strict";

var React                   = require('react');
var invariant               = require('react/lib/invariant');
var Future                  = require('fibers/future');
var Fiber                   = require('fibers');
var getComponentFingerprint = require('./getComponentFingerprint');

/**
 * Create a component class which can get a part of its state by executing async
 * routine.
 *
 * @param {Object} spec
 */
function createClass(spec) {

  invariant(
    spec.render,
    'ReactAsync.createClass(...): Class specification must implement a `render` method.'
  );

  invariant(
    spec.getInitialStateAsync,
    'ReactAsync.createClass(...): Class specification must implement a `getInitialStateAsync` method. ' +
    'Otherwise you should use React.createClass(...) method to create components with no async ' +
    'data fetching'
  );

  var render = spec.render;

  spec.render = function() {
    var getInitialStateAsync = Future.wrap(spec.getInitialStateAsync.bind(this));
    var state = getInitialStateAsync().wait();
    Fiber.current.__reactAsyncStatePacket[getComponentFingerprint(this)] = state;
    this.state = this.state || {};
    for (var k in state)
      this.state[k] = state[k];
    return render.call(this);
  }

  return React.createClass(spec);
}

/**
 * Render component markup asynchronously.
 *
 * @param {ReactComponent} component
 * @param {Function<Error, String, Object>} cb
 */
function renderComponentToString(component, cb) {
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

/**
 * Inject data and optional client scripts into markup.
 *
 * @param {String} markup
 * @param {Object} data
 * @param {Array} scripts
 */
function injectIntoMarkup(markup, data, scripts) {
  var injected = '<script>window.__reactAsyncStatePacket=' + JSON.stringify(data) + '</script>';

  if (scripts) {
    injected += scripts.map(function(script) {
      return '<script src="' + script + '"></script>';
    })
  }

  return markup.replace('</body>', injected + '$&');
}

module.exports = {
  renderComponentToString: renderComponentToString,
  injectIntoMarkup: injectIntoMarkup,
  createClass: createClass
};
