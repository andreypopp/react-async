import assert from 'assert';
import Promise from 'bluebird';
import React from 'react';
import {Async, renderToString} from '../';
import getComponentFingerprint from '../getComponentFingerprint';

function promise(value) {
  return Promise.delay(0).then(() => value);
}

describe('ReactAsync.renderToString (server)', function() {

  @Async
  class Component extends React.Component {
    static dataSpec = {
      message() {
        return {
          key: null,
          start() {
            return promise('hello');
          }
        };
      }
    }

    render() {
      return <div className={this.props.className}>{this.data.message}</div>;
    }
  }

  it('fetches data before rendering a component', function(done) {

    renderToString(<Component />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {key: null, data: 'hello'}});
      done();
    });
  });

  it.skip('fetches data before rendering a component defined with React.createClass', function(done) {

    let LegacyComponent = React.createClass({
      statics: {
        dataSpec: {
          message() {
            return promise('hello');
          }
        }
      },

      render() {
        return <div className={this.props.className}>{this.data.message}</div>;
      }
    });

    LegacyComponent = Async(LegacyComponent);

    renderToString(<LegacyComponent />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {key: null, data: {message: 'hello'}});
      done();
    });
  });

  it('fetches data before rendering a component deep nested', function(done) {

    class Outer extends React.Component {

      render() {
        return <Component ref="async" />;
      }
    }

    renderToString(<Outer />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);

      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {key: null, data: 'hello'}});

      done();
    });
  });

  it('handles async components which have same root node id', function(done) {

    @Async
    class OuterAsync extends React.Component {

      static dataSpec = {
        className() {
          return {
            key: null,
            start() {
              return promise('outer');
            }
          }
        }
      }

      render() {
        return <Component className={this.data.className} />;
      }
    }

    renderToString(<OuterAsync />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('outer') > -1);

      assert.equal(Object.keys(data).length, 2)
      done();
    });
  });

  it('should automatically inject data when only two callback arguments are provided', function(done) {

    renderToString(<Component />, function(err, markup) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncDataPacket__ = {') > -1);
      assert.ok(markup.indexOf('{"message":{"key":null,"data":"hello"}}</script>') > -1);

      done();
    });

  })

  it('should not inject data when three callback arguments are provided', function(done) {

    renderToString(<Component />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncDataPacket__ = {') < 0);

      done();
    });

  });

});
