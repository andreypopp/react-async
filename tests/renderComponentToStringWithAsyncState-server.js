var assert                  = require('assert');
var React                   = require('react');
var ReactAsync              = require('../index');
var getComponentFingerprint = require('../lib/getComponentFingerprint');

var div = React.DOM.div;

function asyncState(state) {
  return function(cb) {
    process.nextTick(cb.bind(null, null, state));
  }
}

describe('ReactAsync.renderComponentToStringWithAsyncState (server)', function() {

  var Async = React.createClass({
    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: asyncState({message: 'hello'}),

    render: function() {
      return this.transferPropsTo(div(null, this.state.message));
    }
  });

  var AsyncApp = React.createClass({
    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: asyncState({message: 'goodbye'}),

    render: function() {
      return React.DOM.html(null, React.DOM.body(null, div(null, this.state.message)));
    }
  });

  it('fetches state before rendering a component', function(done) {

    var c = Async();

    ReactAsync.renderComponentToStringWithAsyncState(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('hello') > -1);

      assert.equal(Object.keys(data).length, 1)
      var id = Object.keys(data)[0];
      var state = data[id];
      assert.ok(state);
      assert.deepEqual(state, {message: 'hello'});

      done();
    });
  });

  it('fetches state before rendering a component deep nested', function(done) {

    var Outer = React.createClass({
      render: function() {
        return Async({ref: 'async'});
      }
    });

    var c = Outer();
    ReactAsync.renderComponentToStringWithAsyncState(c, function(err, markup, data) {
      if (err) return done(err);

      assert.ok(markup.indexOf('hello') > -1);

      assert.equal(Object.keys(data).length, 1)
      var id = Object.keys(data)[0];
      var state = data[id];
      assert.ok(state);
      assert.deepEqual(state, {message: 'hello'});

      done();
    });
  });

  it('handles async components which have same root node id', function(done) {

    var OuterAsync = React.createClass({
      mixins: [ReactAsync.Mixin],
      getInitialStateAsync: asyncState({className: 'outer'}),
      render: function() {
        return Async({className: this.state.className});
      }
    });

    var outer = OuterAsync();
    ReactAsync.renderComponentToStringWithAsyncState(outer, function(err, markup, data) {
      if (err) return done(err);

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('outer') > -1);

      assert.equal(Object.keys(data).length, 2)
      done();
    });
  });

  it('should automatically inject state when only two callback arguments are provided', function(done) {

    var c = AsyncApp();

    ReactAsync.renderComponentToStringWithAsyncState(c, function(err, markup) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('goodbye') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncStatePacket={') > -1);
      assert.ok(markup.indexOf('{"message":"goodbye"}}</script></body>') > -1);

      done();
    });

  })

  it('should not inject state when three callback arguments are provided', function(done) {
    var c = AsyncApp();

    ReactAsync.renderComponentToStringWithAsyncState(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('goodbye') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncStatePacket={') < 0);

      done();
    });

  });

  it('executes getInitialStateAsync in a context of a component', function(done) {

    var C = React.createClass({
      mixins: [ReactAsync.Mixin],

      getInitialStateAsync: function(cb) {
        process.nextTick(function() {
          cb(null, {a: this.props.a});
        }.bind(this));
      },

      render: function() {
        return div(null, this.state.a);
      }
    });

    var c = C({a: '42state'});

    ReactAsync.renderComponentToStringWithAsyncState(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('42state') > -1);

      done();
    });

  });
});
