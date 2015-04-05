/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import invariant from 'react/lib/invariant';
import AsyncComponent from './AsyncComponent';

export default function Async(obj) {
  if (obj.prototype instanceof React.Component) {
    invariant(
      typeof obj.processes === 'function',
      'class should define static processes() method'
    );
    return AsyncDecorator(obj.processes, obj);
  } else {
    return AsyncDecorator.bind(null, obj);
  }
}

function AsyncDecorator(processes, Component) {
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
