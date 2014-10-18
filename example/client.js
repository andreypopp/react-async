var React       = require('react');
var ReactMount  = require('react/lib/ReactMount');
var ReactAsync  = require('../');

ReactMount.allowFullPageRender = true;

var App = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    setTimeout(function() {
      cb(null, {message: 'Hello'});
    }, 0);
  },

  render: function() {
    return React.DOM.html(null,
      React.DOM.body(null,
        React.DOM.div(null, this.state.message || 'Loading...'),
        React.createElement(Nested)));
  }
});

var Nested = React.createClass({
  mixins: [ReactAsync.Mixin],

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
  React.render(React.createElement(App), document);
}

module.exports = App;
