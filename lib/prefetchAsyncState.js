"use strict";

var invariant         = require('react/lib/invariant');
var cloneWithProps    = require('react/lib/cloneWithProps');
var isAsyncComponent  = require('./isAsyncComponent');

/**
 * Prefetch an async state for an unmounted async component instance.
 *
 * @param {ReactComponent} component
 * @param {Callback} cb
 */
function prefetchAsyncState(component, cb) {

  invariant(
    isAsyncComponent(component),
    "%s should be an async component to be able to prefetch async state, " +
    "but getInitialStateAsync(cb) method is missing or is not a function",
    component.displayName
  );

  var getInitialStateAsync = Object.getPrototypeOf(component).getInitialStateAsync;

  getInitialStateAsync.call(component, function(err, asyncState) {
    if (err) {
      return cb(err);
    }

    cb(null, cloneWithProps(component, {asyncState: asyncState}));
  });
}

module.exports = prefetchAsyncState;
