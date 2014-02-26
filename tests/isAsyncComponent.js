var assert          = require('assert');
var React           = require('react');
var ReactAsync      = require('../');

var Component = React.createClass({

  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    cb(null, {});
  },

  render: function() {
    return React.DOM.div(this.state.message || 'loading...');
  }
});

describe('ReactAsync.isAsyncComponent', function() {

  it('works', function() {
    assert(ReactAsync.isAsyncComponent(Component()));
    var NonAsync = React.createClass({render: function() {}});
    assert(!ReactAsync.isAsyncComponent(NonAsync()));
  });
});
