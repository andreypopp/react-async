var assert          = require('assert');
var React           = require('react');
var ReactTestUtils  = require('react/lib/ReactTestUtils');
var ReactAsync      = require('../');
var when            = require('when');

function wait(ms, cb) {
  setTimeout(cb, ms);
}

describe('ReactAsync.prefetchAsyncState (browser)', function() {

  var c, called;

  var render = function() {
    return React.DOM.div(null, this.state.message || 'loading...');
  };

  var Component = React.createClass({

    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: function(cb) {
      called += 1;
      wait(10, function() { cb(null, {message: 'hello'}); });
    },

    render: render
  });

  var PromiseComponent = React.createClass({

    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: function(cb) {
      called += 1;
      return when.resolve({message: 'hellofrompromise'}).delay(10);
    },

    render: render
  });

  beforeEach(function() {
    called = 0;
    c = null;
  });

  it('prefetches async state', function(done) {
    c = React.createElement(Component);
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

  it('prefetches async state with promise', function(done) {
    c = React.createElement(PromiseComponent);
    ReactAsync.prefetchAsyncState(c, function(err, c) {
      assert.equal(called, 1);
      c = ReactTestUtils.renderIntoDocument(c);
      wait(40, function() {
        assert.equal(called, 1);
        assert.deepEqual(c.state, {message: 'hellofrompromise'});
        done();
      });
    });
  });

});
