var assert                  = require('assert');
var React                   = require('react');
var ReactTestUtils          = require('react/lib/ReactTestUtils');
var ReactAsync              = require('../');
var getComponentFingerprint = require('../lib/getComponentFingerprint');
var when                    = require('when');

function wait(ms, cb) {
  setTimeout(cb, ms);
}

describe('ReactAsync.Mixin (browser)', function() {

  var called, c;

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

  it('fetches state via getInitialStateAsync', function(done) {
    c = React.createElement(Component);
    c = ReactTestUtils.renderIntoDocument(c);
    assert.deepEqual(c.state, {});
    wait(50, function() {
      assert.equal(called, 1);
      assert.deepEqual(c.state, {message: 'hello'});
      done();
    });
  });

  it('fetches state via getInitialStateAsync returning a promise', function(done) {
    c = React.createElement(PromiseComponent);
    c = ReactTestUtils.renderIntoDocument(c);
    assert.deepEqual(c.state, {});
    wait(50, function() {
      assert.equal(called, 1);
      assert.deepEqual(c.state, {message: 'hellofrompromise'});
      done();
    });
  });

  it('injects async state via asyncState prop', function(done) {
    c = React.createElement(Component, {asyncState: {message: 'injected'}});
    c = ReactTestUtils.renderIntoDocument(c);
    assert.deepEqual(c.state, {message: 'injected'});
    wait(50, function() {
      assert.equal(called, 0);
      assert.deepEqual(c.state, {message: 'injected'});
      done();
    });
  });

  it('deserializes state using stateFromJSON method (if defined)', function(done) {

    function Message(msg) {
      this.msg = msg;
    }
    Message.prototype.say = function() {
      return this.msg;
    };

    var InjectData = {
      getInitialState: function() {
        window.__reactAsyncStatePacket = {};
        window.__reactAsyncStatePacket[getComponentFingerprint(this)] = {
          message: 'hello'
        };
        return {};
      }
    };

    var Component = React.createClass({

      mixins: [InjectData, ReactAsync.Mixin],

      getInitialStateAsync: function(cb) {
        called += 1;
        wait(10, function() { cb(null, {message: 'hello'}); });
      },

      stateFromJSON: function(state) {
        state.message = new Message(state.message);
        return state;
      },

      render: function() {
        return React.DOM.div(this.state.message ? this.state.message.say() : 'loading...');
      }
    });

    c = React.createElement(Component);


    c = ReactTestUtils.renderIntoDocument(c);

    assert.ok(c.state.message instanceof Message);
    assert.deepEqual(c.state, {"message":{"msg":"hello"}});
    assert.equal(called, 0);

    wait(50, function() {
      assert.ok(c.state.message instanceof Message);
      assert.deepEqual(c.state, {"message":{"msg":"hello"}});
      assert.equal(called, 0);
      done();
    });

  });


});
