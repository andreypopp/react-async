var assert          = require('assert');
var React           = require('react');
var ReactTestUtils  = require('react/lib/ReactTestUtils');
var ReactAsync      = require('../');

function wait(ms, cb) {
  setTimeout(cb, ms);
}

describe('ReactAsync.Mixin (browser)', function() {

  var called, c;

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

  it('fetches state via getInitialStateAsync', function(done) {
    c = Component();
    c = ReactTestUtils.renderIntoDocument(c);
    assert.deepEqual(c.state, {});
    wait(50, function() {
      assert.equal(called, 1);
      assert.deepEqual(c.state, {message: 'hello'});
      done();
    });
  });

  it('injects async state via asyncState prop', function(done) {
    c = Component({asyncState: {message: 'injected'}});
    c = ReactTestUtils.renderIntoDocument(c);
    assert.deepEqual(c.state, {message: 'injected'});
    wait(50, function() {
      assert.equal(called, 0);
      assert.deepEqual(c.state, {message: 'injected'});
      done();
    });
  });

});
