"use strict";

/**
 * Check if a component is an async component.
 *
 * @param {ReactComponent} component
 */
function isAsyncComponent(component) {
  return typeof component.constructor.type.prototype.getInitialStateAsync === 'function';
}

module.exports = isAsyncComponent;
