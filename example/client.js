var React       = require('react');
var ReactMount  = require('react/lib/ReactMount');
var ReactAsync  = require('../');

ReactMount.allowFullPageRender = true;

var App = ReactAsync.createClass({

  getStateAsync: function(cb) {
    setTimeout(function() {
      cb(null, {message: 'Hello'});
    }, 0);
  },

  render: function() {
    return React.DOM.html(null,
      React.DOM.head(null,
        React.DOM.script({src: '/bundle.js'})),
      React.DOM.body(null,
        React.DOM.div(null, this.state.message || 'Loading...'),
        Nested()));
  }
});

var Nested = ReactAsync.createClass({

  getStateAsync: function(cb) {
    setTimeout(function() {
      cb(null, {message: 'Hi'});
    }, 0);
  },

  render: function() {
    return React.DOM.div(null, this.state.message || 'Loading...');
  }
});

if (typeof window !== 'undefined') {

  window.onload = function() {
    React.renderComponent(App(), document);
  }
}

module.exports = App;
