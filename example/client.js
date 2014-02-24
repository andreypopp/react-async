var React       = require('react');
var ReactMount  = require('react/lib/ReactMount');
var ReactAsync  = require('../');

ReactMount.allowFullPageRender = true;

var App = ReactAsync.createClass({

  getInitialStateAsync: function(cb) {
    setTimeout(function() {
      cb(null, {message: 'Hello'});
    }, 0);
  },

  render: function() {
    return React.DOM.html(null,
      React.DOM.body(null,
        React.DOM.div(null, this.state.message || 'Loading...'),
        Nested()));
  }
});

var Nested = ReactAsync.createClass({

  getInitialStateAsync: function(cb) {
    setTimeout(function() {
      cb(null, {message: 'Hi'});
    }, 0);
  },

  render: function() {
    return React.DOM.div(null, this.state.message || 'Loading...');
  }
});

if (typeof window !== 'undefined') {
  React.renderComponent(App(), document);
}

module.exports = App;
