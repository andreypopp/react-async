/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import ExecutionEnvironment from 'react/lib/ExecutionEnvironment';
import invariant from 'react/lib/invariant';
import emptyFunction from 'react/lib/emptyFunction';

let Fiber;
let Future;
let __require = require;

try {
  Fiber = __require('fibers');
  Future = __require('fibers/future');
} catch (err) {

}

export default class AsyncComponent extends React.Component {

  static processes(props, state) {
    invariant(
      false,
      'AsyncComponent subclass should implement processes() class method'
    );
  }

  constructor(props) {
    super(props);
    this._componentFingerprint = null;
    this.processes = null;
  }

  componentWillMount() {
    this._componentFingerprint = getComponentFingerprint(this);
    this._initializeProcesses(this.props, this.state);
    if (ExecutionEnvironment.canUseDOM || needAdvance()) {
      this._reconcileProcesses(this.props, this.state);
    }
  }

  componentWillUpdate(props, state) {
    this._reconcileProcesses(props, state);
  }

  _initializeProcesses(props, state) {
    let processes = this.constructor.processes(props, state);
    let storedProcesses = retrieveProcesses(this._componentFingerprint);
    let nextProcesses = {};
    for (let name in processes) {
      nextProcesses[name] = {
        ...DUMMY_PROCESS_DESC,
        ...storedProcesses[name]
      };
    }
    this.processes = nextProcesses;
  }

  _reconcileProcesses(props, state) {
    let nextProcesses = this.constructor.processes(props, state);
    let names = Object.keys(nextProcesses);
    // reconcile new process dictionary
    for (let i = 0; i < names.length; i++) {
      let name = names[i];
      let prevProcess = this.processes[name];
      let nextProcess = nextProcesses[name];
      invariant(
        isProcessDescription(nextProcess),
        'processes should provide a start method and a key property, got %s instead',
        nextProcess
      );
      if (prevProcess.key !== nextProcess.key) {
        if (prevProcess.process && typeof prevProcess.process.cancel === 'function') {
          prevProcess.process.cancel();
        }
        nextProcess = {
          ...nextProcess,
          process: nextProcess.start(),
          data: nextProcess.keepData ? prevProcess.data : nextProcess.data
        };
        // Subscribe to process if and only if we can access DOM and so we can
        // reconcile after next process step.
        if (ExecutionEnvironment.canUseDOM) {
          nextProcess.process.then(
            this._onProcessStep.bind(this, name, nextProcess.key),
            this._onProcessError.bind(this, name, nextProcess.key)
          );
        }
        nextProcesses[name] = nextProcess;
      } else {
        nextProcesses[name] = prevProcess;
      }
    }
    // cancel old process which were not mentioned in nextProcesses
    let prevNames = Object.keys(this.processes);
    for (let i = 0; i < names.length; i++) {
      let name = names[i];
      if (names.indexOf(name) === -1) {
        let process = this.processes[name];
        if (process.process && typeof process.process.cancel === 'function') {
          process.process.cancel();
        }
      }
    }
    // determine if we need to advance single process step
    if (needAdvance()) {
      nextProcesses = advanceProcesses(nextProcesses);
      storeProcesses(this._componentFingerprint, nextProcesses);
    }
    // update process dictionary
    this.processes = nextProcesses;
  }

  _onProcessStep(name, key, data) {
    let process = this.processes[name];
    if (process && process.key === key) {
      this.processes = {
        ...this.processes,
        [name]: {...process, data}
      };
      this.forceUpdate();
    }
  }

  _onProcessError(name, key, err) {
    let process = this.processes[name];
    if (process && process.key === key) {
      console.error(`error in process "${name}" of ${this.constructor.name} component`);
      throw err;
    }
  }

}

const DUMMY_PROCESS = {
  cancel: emptyFunction,
  then: emptyFunction
};

const DUMMY_PROCESS_DESC = {
  key: undefined,
  data: null,
  process: DUMMY_PROCESS,
  start() {
    return DUMMY_PROCESS;
  }
}

function needAdvance() {
  return (
    Fiber !== undefined &&
    Fiber.current !== undefined &&
    Fiber.current.__reactAsyncDataPacket__ !== undefined
  );
}

function advanceProcesses(processes) {
  processes = {...processes};

  let futures = [];
  for (let name in processes) {
    let process = processes[name];
    if (!process.process) {
      continue;
    }
    let future = Future.wrap((process, cb) =>
        process.process.then(cb.bind(null, null), cb))(process);
    futures.push({future, name, process});
  }

  Future.wait.apply(Future, futures.map(f => f.future));

  for (let i = 0; i < futures.length; i++) {
    let future = futures[i];
    processes[future.name] = {...future.process, data: future.future.get()};
  }

  return processes;
}

function retrieveProcesses(key) {
  if (!ExecutionEnvironment.canUseDOM || window.__reactAsyncDataPacket__ === undefined) {
    return {};
  } else {
    return window.__reactAsyncDataPacket__[key] || {};
  }
}

function storeProcesses(key, processes) {
  let data = {};
  for (let name in processes) {
    let process = processes[name];
    data[name] = {
      key: process.key,
      data: process.data
    };
  }
  Fiber.current.__reactAsyncDataPacket__[key] = data;
}

function isProcessDescription(o) {
  return o && typeof o.start === 'function' && typeof o.key !== undefined;
}

function getComponentFingerprint(component) {
  let instance = component._reactInternalInstance;
  let rootNodeID = instance._rootNodeID;
  let mountDepth = 0;
  while (instance._currentElement._owner) {
    mountDepth += 1;
    instance = instance._currentElement._owner;
  }
  return `${rootNodeID}__${mountDepth}`;
}
