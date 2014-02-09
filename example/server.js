var express     = require('express');
var browserify  = require('connect-browserify');
var ReactAsync  = require('../');
var App         = require('./client');

express()
  .get('/bundle.js', browserify(__dirname + '/client', {debug: true, watch: true}))
  .get('/', function(req, res, next) {
    ReactAsync.renderComponentToString(App(), function(err, markup) {
      if (err) return next(err);
      res.send(markup);
    });
  })
  .listen(3000, function() {
    console.log('Point your browser to http://localhost:3000');
  });
