;(function() {

  window.__ReactShim = window.__ReactShim || {};

  window.__ReactShim.invariant = function(check, msg) {
    if (!check) {
      throw new Error(msg);
    }
  }

})();
