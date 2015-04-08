import express from 'express';
import browserify from 'connect-browserify';
import React from 'react';
import * as ReactAsync from '../src';
import App from './client';

express()
  .get(
    '/bundle.js',
    browserify({
      entry: require.resolve('./client'),
      debug: true,
      watch: true,
      transforms: [
        ['babelify', {stage: 0}]
      ]
    }))
  .get('/', function(req, res, next) {
    if (process.env.NO_PRERENDER) {
      let markup = React.renderToString(<App />);
      markup = ReactAsync.injectIntoMarkup(markup, {}, ['./bundle.js']);
      res.send(markup);
    } else {
      ReactAsync.renderToString( <App />, function(err, markup, data) {
        if (err) {
          return next(err);
        }
        markup = ReactAsync.injectIntoMarkup(markup, data, ['./bundle.js']);
        res.send(markup);
      });
    }
  })
  .get('/api/message', function(req, res) {
    res.send({message: `Hello, ${req.query.name}`});
  })
  .listen(3000, function() {
    console.log('Point your browser to http://localhost:3000');
  });
