"use strict";

/**
 * Inject data and optional client scripts into markup.
 *
 * @param {String} markup
 * @param {Object} data
 * @param {?Array} scripts
 */
function injectIntoMarkup(markup, data, scripts) {
  var injected = '<script>window.__reactAsyncStatePacket=' + JSON.stringify(data) + '</script>';

  if (scripts) {
    injected += scripts.map(function(script) {
      return '<script src="' + script + '"></script>';
    }).join('');
  }

  if (markup.indexOf('</body>') > -1) {
    return markup.replace('</body>', injected + '$&');
  } else {
    return markup + injected;
  }
}

module.exports = injectIntoMarkup;
