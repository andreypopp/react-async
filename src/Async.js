/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import invariant from 'invariant';
import AsyncComponent from './AsyncComponent';

/**
 * This is a component class decorator which receives a component class, an
 * observable specification and returns a new component class which subscribes
 * to observables and re-render the decorated component with data from
 * observables injected via props.
 *
 * There are several syntaxes to call the decorator.
 *
 * ES7 class decorator syntax:
 *
 *    @Async(observe)
 *    class Component extends React.Component {
 *
 *      ...
 *    }
 *
 * ES7 class decorator syntax with observable specifications defined inline:
 *
 *    @Async
 *    class Component extends React.Component {
 *
 *      static observe(props) {
 *        ...
 *      }
 *    }
 *
 * ES6:
 *
 *    class Component extends React.Component {
 *      ...
 *    }
 *    Component = Async(Component, observe)
 *
 * All three syntaxes result in an equivalent behaviour.
 */
export default function Async(obj, observe) {
  if (obj && obj.prototype && typeof obj.prototype.render === 'function') {
    if (observe === undefined) {
      invariant(
        typeof obj.observe === 'function',
        'class should define static observe() method'
      );
      observe = obj.observe;
    }
    return decorateComponentClass(observe, obj);
  } else {
    return decorateComponentClass.bind(null, obj);
  }
}

function decorateComponentClass(observe, Component) {
  return class extends AsyncComponent {

    constructor(props) {
      super(props);
    }

    static observe(props, state) {
      return observe(props, state);
    }

    render() {
      let props = {...this.props};
      for (let name in this.observed) {
        if (this.observed.hasOwnProperty(name)) {
          props[name] = this.observed[name].data;
        }
      }
      return <Component {...props} />;
    }
  };
}
