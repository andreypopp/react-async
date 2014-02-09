"use strict";

var React     = require('react');
var invariant = require('react/lib/invariant');
var Future    = require('fibers/future');
var Fiber     = require('fibers');

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
    spec.render,
    'ReactAsync.createClass(...): Class specification must implement a `getStateAsync` method.' +
    'Otherwise you should use React.createClass(...) method to create components with no async ' +
    'data fetching'
  );

  var render = spec.render;

  spec.render = function() {
    var getStateAsync = Future.wrap(spec.getStateAsync.bind(this));
    var state = getStateAsync().wait();
    Fiber.current.__reactAsyncStatePacket[this._rootNodeID] = state;
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
  Fiber(function() {
    Fiber.current.__reactAsyncStatePacket = {};
    try {
      React.renderComponentToString(component, function(markup) {
        var dataPacker = renderDataPacket(Fiber.current.__reactAsyncStatePacket);
        delete Fiber.current.__reactAsyncStatePacket;

        if (/<\/body>$/.exec(markup)) {
          markup = markup.replace(/<\/body>$/, dataPacker + '</body>')
        } else if (/<\/html>$/.exec(markup)) {
          markup = markup.replace(/<\/html>$/, dataPacker + '</body>')
        } else {
          markup = markup + dataPacker;
        }

        cb(null, markup);
      });
    } catch(err) {
      return cb(err);
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
