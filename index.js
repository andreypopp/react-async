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
 * @param {Function<Error, String>} cb
 */
function renderComponentToString(component, cb) {
  Fiber(function() { // jshint ignore:line
    var markup;
    var data;
    var err;
    Fiber.current.__reactAsyncStatePacket = {};
    try {
      markup = React.renderComponentToString(component);
      data = Fiber.current.__reactAsyncStatePacket;
      delete Fiber.current.__reactAsyncStatePacket;

      var dataPacket = renderDataPacket(data);

      if (/<\/body>$/.exec(markup)) {
        markup = markup.replace(/<\/body>$/, dataPacket + '</body>')
      } else if (/<\/html>$/.exec(markup)) {
        markup = markup.replace(/<\/html>$/, dataPacket + '</html>')
      } else {
        markup = markup + dataPacket;
      }
    } catch(e) {
      err = e;
    } finally {
      delete Fiber.current.__reactAsyncStatePacket;
    }

    if (err) {
      cb(err);
    } else {
      cb(null, markup, data);
    }
  }).run();
}

function renderDataPacket(state) {
  return (
    '<script>' +
    'window.__reactAsyncStatePacket = ' + JSON.stringify(state) + ';' +
    '</script>'
  );
}

module.exports = {
  renderComponentToString: renderComponentToString,
  createClass: createClass
};
