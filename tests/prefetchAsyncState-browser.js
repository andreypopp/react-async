var assert          = require('assert');
var React           = require('react');
var ReactTestUtils  = require('react/lib/ReactTestUtils');
var ReactAsync      = require('../');

function wait(ms, cb) {
  setTimeout(cb, ms);
}

describe('ReactAsync.prefetchAsyncState (browser)', function() {

  var c, called;

  var Component = React.createClass({

    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: function(cb) {
      called += 1;
      wait(10, function() { cb(null, {message: 'hello'}); });
    },

    render: function() {
      return React.DOM.div(this.state.message || 'loading...');
    }
  });

  beforeEach(function() {
    called = 0;
    c = null;
  });

  it('prefetches async state', function(done) {
    c = Component();
    ReactAsync.prefetchAsyncState(c, function(err, c) {
      assert.equal(called, 1);
      c = ReactTestUtils.renderIntoDocument(c);
      wait(40, function() {
        assert.equal(called, 1);
        assert.deepEqual(c.state, {message: 'hello'});
        done();
      });
    });
  });

});
