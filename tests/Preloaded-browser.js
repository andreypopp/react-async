"use strict";

var assert          = require('assert');
var React           = require('react');
var ReactTestUtils  = require('react/lib/ReactTestUtils');
var ReactAsync      = require('../');
var Preloaded       = require('../lib/Preloaded');

function wait(ms, cb) {
  setTimeout(cb, ms);
}

describe('Preloaded (browser)', function() {

  var c;
  var componentCalled;
  var anotherComponentCalled;
  var componentRenderTrace;
  var anotherComponentRenderTrace;

  var Preloader = React.createClass({

    render: function() {
      return React.DOM.div(null, 'preloader');
    }
  });

  var Component = React.createClass({

    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: function(cb) {
      componentCalled += 1;
      wait(10, function() { cb(null, {message: 'hello'}); });
    },

    render: function() {
      var message = this.state.message ?
        (this.state.message + (this.props.message || '')) :
        'loading...';
      componentRenderTrace.push(message);
      return React.DOM.div(null, message);
    }
  });

  var AnotherComponent = React.createClass({

    mixins: [ReactAsync.Mixin],

    getInitialStateAsync: function(cb) {
      anotherComponentCalled += 1;
      wait(10, function() { cb(null, {message: 'hello'}); });
    },

    render: function() {
      var message = this.state.message ?
        (this.props.message || '') + this.state.message :
        'loading...';
      anotherComponentRenderTrace.push(message);
      return React.DOM.div(null, message);
    }
  });

  function markup() {
    return c.getDOMNode().innerHTML;
  }

  beforeEach(function() {
    c = null;
    componentCalled = 0;
    anotherComponentCalled = 0;
    componentRenderTrace = [];
    anotherComponentRenderTrace = [];
  });

  describe('using no preloader component', function() {

    function create() {
      var c = React.createElement(Preloaded, null, React.createElement(Component));
      c = ReactTestUtils.renderIntoDocument(c);
      return c;
    }

    it('renders children component', function(done) {
      c = create();
      assert.equal(markup(), 'loading...');
      wait(30, function() {
        assert.equal(markup(), 'hello');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['loading...', 'hello']
        );

        done();
      });
    });

    it('updates children component of the same type', function(done) {
      c = create();
      assert.equal(markup(), 'loading...');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(Component, {message: '!'})});

        assert.equal(markup(), 'hello!');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['loading...', 'hello', 'hello!']
        );

        done();
      });
    });

    it('updates children component w/ component of another type', function(done) {
      c = create();
      assert.equal(markup(), 'loading...');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(AnotherComponent, {message: '?'})});
        assert.equal(markup(), 'hello');
        wait(30, function() {
          assert.equal(markup(), '?hello');

          assert.equal(componentCalled, 1);
          assert.equal(anotherComponentCalled, 1);

          assert.deepEqual(
            componentRenderTrace,
            ['loading...', 'hello', 'hello']
          );
          assert.deepEqual(
            anotherComponentRenderTrace,
            ['?hello']
          );

          done();
        });
      });
    });

    it('cancels pending update on re-render', function(done) {
      c = create();
      assert.equal(markup(), 'loading...');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(AnotherComponent, {message: '?'})});
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(Component, {message: '!!'})});
        assert.equal(markup(), 'hello!!');
        wait(30, function() {
          assert.equal(markup(), 'hello!!');

          assert.equal(componentCalled, 1);
          assert.equal(anotherComponentCalled, 1);

          assert.deepEqual(
            componentRenderTrace,
            ['loading...', 'hello', 'hello', 'hello!!']
          );
          assert.deepEqual(
            anotherComponentRenderTrace,
            []
          );
          done();
        });
      });
    });

  });

  describe('using with preloader component', function() {

    function create() {
      var c = React.createElement(
        Preloaded,
        {preloader: React.createElement(Preloader)},
        React.createElement(Component));
      c = ReactTestUtils.renderIntoDocument(c);
      return c;
    }

    it('shows preloader on first render', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['hello']
        );

        done();
      });
    });

    it('does not show preloader during transitioning between same childs', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(Component, {message: '!'})});

        assert.equal(markup(), 'hello!');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['hello', 'hello!']
        );

        done();
      });
    });

    it('does not show preloader during transitioning between different childs', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(AnotherComponent, {message: '?'})});
        assert.equal(markup(), 'hello');
        wait(30, function() {
          assert.equal(markup(), '?hello');

          assert.equal(componentCalled, 1);
          assert.equal(anotherComponentCalled, 1);

          assert.deepEqual(
            componentRenderTrace,
            ['hello', 'hello']
          );
          assert.deepEqual(
            anotherComponentRenderTrace,
            ['?hello']
          );

          done();
        });
      });
    });

  });

  describe('using with preloader component to always show it', function() {

    function create() {
      var c = React.createElement(
        Preloaded,
        {preloader: React.createElement(Preloader), alwayUsePreloader: true},
        React.createElement(Component));
      c = ReactTestUtils.renderIntoDocument(c);
      return c;
    }

    it('shows preloader on first render', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['hello']
        );

        done();
      });
    });

    it('does not show preloader during transitioning between same childs', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(Component, {message: '!'})});

        assert.equal(markup(), 'hello!');

        assert.equal(componentCalled, 1);

        assert.deepEqual(
          componentRenderTrace,
          ['hello', 'hello!']
        );

        done();
      });
    });

    it('shows preloder during transition between different childs', function(done) {
      c = create();
      assert.equal(markup(), 'preloader');
      wait(30, function() {
        assert.equal(markup(), 'hello');
        c.setProps({children: React.createElement(AnotherComponent, {message: '?'})});
        assert.equal(markup(), 'preloader');
        wait(30, function() {
          assert.equal(markup(), '?hello');

          assert.equal(componentCalled, 1);
          assert.equal(anotherComponentCalled, 1);

          assert.deepEqual(
            componentRenderTrace,
            ['hello']
          );
          assert.deepEqual(
            anotherComponentRenderTrace,
            ['?hello']
          );

          done();
        });
      });
    });

  });

});
