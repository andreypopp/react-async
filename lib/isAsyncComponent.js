"use strict";

/**
 * Check if a component is an async component.
 *
 * @param {ReactComponent} component
 */
function isAsyncComponent(component) {
  return typeof Object.getPrototypeOf(component).getInitialStateAsync === 'function';
}

module.exports = isAsyncComponent;
