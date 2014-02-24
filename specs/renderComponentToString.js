var assert                  = require('assert');
var React                   = require('react');
var ReactAsync              = require('../index');
var getComponentFingerprint = require('../getComponentFingerprint');

var div = React.DOM.div;

function asyncState(state) {
  return function(cb) {
    process.nextTick(cb.bind(null, null, state));
  }
}

describe('ReactAsync.renderComponentToString', function() {

  var Async = ReactAsync.createClass({
    getInitialStateAsync: asyncState({message: 'hello'}),

    render: function() {
      return this.transferPropsTo(div(null, this.state.message));
    }
  });

  var AsyncApp = ReactAsync.createClass({
    getInitialStateAsync: asyncState({message: 'goodbye'}),

    render: function() {
      return React.DOM.html(null, React.DOM.body(null, div(null, this.state.message)));
    }
  });

  it('fetches state before rendering a component', function(done) {

    var c = Async();

    ReactAsync.renderComponentToString(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('hello') > -1);

      var state = data[getComponentFingerprint(async)];
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
    ReactAsync.renderComponentToString(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c._renderedComponent;
      assert.ok(async);
      assert.ok(markup.indexOf('hello') > -1);

      var state = data[getComponentFingerprint(async)];
      assert.ok(state);
      assert.deepEqual(state, {message: 'hello'});

      done();
    });
  });

  it('handles async components which have same root node id', function(done) {

    var OuterAsync = ReactAsync.createClass({
      getInitialStateAsync: asyncState({className: 'outer'}),
      render: function() {
        return Async({className: this.state.className});
      }
    });

    var outer = OuterAsync();
    ReactAsync.renderComponentToString(outer, function(err, markup, data) {
      if (err) return done(err);

      var inner = outer._renderedComponent;
      assert.ok(inner);
      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('outer') > -1);

      innerState = data[getComponentFingerprint(inner)];
      assert.ok(innerState);
      assert.deepEqual(innerState, {message: 'hello'});

      outerState = data[getComponentFingerprint(outer)];
      assert.ok(outerState);
      assert.deepEqual(outerState, {className: 'outer'});

      done();
    });
  });

  it('should automatically inject state when only two callback arguments are provided', function(done) {

    var c = AsyncApp();

    ReactAsync.renderComponentToString(c, function(err, markup) {
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

    ReactAsync.renderComponentToString(c, function(err, markup, data) {
      if (err) return done(err);

      var async = c;
      assert.ok(async);
      assert.ok(markup.indexOf('goodbye') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncStatePacket={') < 0);

      done();
    });

  });
});
