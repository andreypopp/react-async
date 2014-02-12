"use strict";

/**
 * Get a fingerprint of the component.
 *
 * @param {Object} component
 * @return {String}
 */
function getComponentFingerprint(component) {
  return component._rootNodeID + '__' + component._mountDepth;
}

module.exports = getComponentFingerprint;
