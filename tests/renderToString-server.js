var assert                  = require('assert');
var React                   = require('react');
var ReactAsync              = require('../index');
var Fiber                   = require('fibers');

var div = React.DOM.div;

function asyncState(state) {
  return function(cb) {
    process.nextTick(cb.bind(null, null, state));
  }
}

describe('React.renderComponentToString (server)', function() {

  var Async = React.createClass({
    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: asyncState({message: 'hello'}),

    render: function() {
      return div(null, this.state.message);
    }
  });

  it('works inside Fiber', function() {
    Fiber(function() {
      var markup = React.renderToString(React.createElement(Async));
      assert(markup.indexOf('<div') > -1);
      assert(markup.indexOf('hello') === -1);
    }).run();
  });
});
