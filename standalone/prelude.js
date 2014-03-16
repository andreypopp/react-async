;(function() {

  window.__ReactShim.invariant = function(check, msg) {
    if (!check) {
      throw new Error(msg);
    }
  }

})();
