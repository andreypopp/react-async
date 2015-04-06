/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import invariant from 'react/lib/invariant';
import AsyncComponent from './AsyncComponent';

/**
 * Decorate React component class with async processes.
 *
 * This is a component class decorator which receives a component class, a
 * processes specification and returns a new component class which executes
 * processes and re-render the decorated component which data injected via
 * props.
 *
 * There are several syntaxes to call the decorator.
 *
 * ES7 class decorator syntax:
 *
 *    @Async(processes)
 *    class Component extends React.Component {
 *
 *      ...
 *    }
 *
 * ES7 class decorator syntax with processes specifications defined inline:
 *
 *    @Async
 *    class Component extends React.Component {
 *
 *      static processes(props) {
 *        ...
 *      }
 *    }
 *
 * ES6:
 *
 *    class Component extends React.Component {
 *      ...
 *    }
 *    Component = Async(Component, processes)
 *
 * All three syntaxes result in an equivalent behaviour.
 */
export default function Async(obj, processes) {
  if (obj.prototype instanceof React.Component) {
    if (processes === undefined) {
      invariant(
        typeof obj.processes === 'function',
        'class should define static processes() method'
      );
      processes = obj.processes;
    }
    return decorateComponentClass(processes, obj);
  } else {
    return decorateComponentClass.bind(null, obj);
  }
}

function decorateComponentClass(processes, Component) {
  return class extends AsyncComponent {

    constructor(props) {
      super(props);
    }

    static processes(props, state) {
      return processes(props, state);
    }

    render() {
      let props = {...this.props};
      for (let name in this.processes) {
        props[name] = this.processes[name].data;
      }
      return <Component {...props} />;
    }
  };
};
