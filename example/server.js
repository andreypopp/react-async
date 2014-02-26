var express     = require('express');
var browserify  = require('connect-browserify');
var ReactAsync  = require('../');
var App         = require('./client');

express()
  .get('/bundle.js', browserify(__dirname + '/client', {debug: true, watch: true}))
  .get('/', function(req, res, next) {
    ReactAsync.renderComponentToStringWithAsyncState(App(), function(err, markup, data) {
      if (err) return next(err);

      markup = ReactAsync.injectIntoMarkup(markup, data, ['./bundle.js']);

      res.send(markup);
    });
  })
  .listen(3000, function() {
    console.log('Point your browser to http://localhost:3000');
  });
