/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import ExecutionEnvironment from 'react/lib/ExecutionEnvironment';
import invariant from 'react/lib/invariant';
import emptyFunction from 'react/lib/emptyFunction';
import memoized from './memoized';

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
    this.processes = null;
  }

  componentWillMount() {
    let shouldRunOnServer = checkIfShouldRunOnServer();
    if (shouldRunOnServer || ExecutionEnvironment.canUseDOM) {
      this._initializeProcesses(this.props, this.state);
    }
    if (shouldRunOnServer) {
      this.processes = tickProcesses(this.processes);
      storeProcesses(this._fingerprint, this.processes);
      this._cancelProcesses();
    };
  }

  componentWillUpdate(props, state) {
    this._reconcileProcesses(props, state);
  }

  componentWillUnmount() {
    this._cancelProcesses();
    this.processes = {};
  }

  @memoized
  get _fingerprint() {
    let instance = this._reactInternalInstance;
    let rootNodeID = instance._rootNodeID;
    let mountDepth = 0;
    while (instance._currentElement._owner) {
      mountDepth += 1;
      instance = instance._currentElement._owner;
    }
    return `${rootNodeID}__${mountDepth}`;
  }

  _cancelProcesses() {
    for (let name in this.processes) {
      cancelProcess(this.processes[name]);
    }
  }

  _initializeProcesses(props, state) {
    let processes = this.constructor.processes(props, state);
    let storedProcesses = retrieveProcesses(this._fingerprint);
    let nextProcesses = {};
    for (let name in processes) {
      let process = processes[name];
      invariant(
        isProcessDescription(process),
        'processes should provide a start method and a id property, got %s instead',
        nextProcess
      );
      let storedProcess = storedProcesses[name];
      let nextProcess;
      if (storedProcess) {
        nextProcess = {
          ...process,
          ...storedProcess
        };
        if (typeof nextProcess.resume === 'function') {
          nextProcess.process = nextProcess.resume(nextProcess.data);
        }
      } else {
        nextProcess = {
          ...process,
          process: process.start()
        };
      }
      this._subscribeToProcess(name, nextProcess);
      nextProcesses[name] = nextProcess;
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
        'processes should provide a start method and a id property, got %s instead',
        nextProcess
      );
      if (prevProcess.id !== nextProcess.id) {
        cancelProcess(prevProcess);
        nextProcess = {
          ...nextProcess,
          process: nextProcess.start(),
          data: nextProcess.keepData ? prevProcess.data : nextProcess.data
        };
        this._subscribeToProcess(name, nextProcess);
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
        cancelProcess(this.processes[name]);
      }
    }
    // update process dictionary
    this.processes = nextProcesses;
  }

  _subscribeToProcess(name, processDesc) {
    if (ExecutionEnvironment.canUseDOM && processDesc.process) {
      processDesc.process.then(
        this._onProcessStep.bind(this, name, processDesc.id),
        this._onProcessError.bind(this, name, processDesc.id)
      );
    }
  }

  _onProcessStep(name, id, data) {
    let process = this.processes[name];
    if (process && process.id === id) {
      this.processes = {
        ...this.processes,
        [name]: {...process, data}
      };
      this.forceUpdate();
    }
  }

  _onProcessError(name, id, err) {
    let process = this.processes[name];
    if (process && process.id === id) {
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
  id: undefined,
  data: undefined,
  process: DUMMY_PROCESS,
  start() {
    return DUMMY_PROCESS;
  }
}

function checkIfShouldRunOnServer() {
  return (
    Fiber !== undefined &&
    Fiber.current !== undefined &&
    Fiber.current.__reactAsyncDataPacket__ !== undefined
  );
}

function tickProcesses(processes) {
  processes = {...processes};

  let futures = [];
  for (let name in processes) {
    let process = processes[name];
    if (!process.process) {
      continue;
    }
    let future = Future.wrap((process, cb) => {
      let resolved = false;
      process.process.then(
        function(result) {
          if (resolved) {
            return;
          }
          resolved = true;
          cb(null, result);
        },
        function(err) {
          if (resolved) {
            return;
          }
          resolved = true;
          cb(err);
        });
    })(process);
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
      id: process.id,
      data: process.data
    };
  }
  Fiber.current.__reactAsyncDataPacket__[key] = data;
}

function cancelProcess(processDesc) {
  let process = processDesc.process;
  if (process && typeof process.cancel === 'function') {
    process.cancel();
  }
}

function isProcessDescription(o) {
  return o && typeof o.start === 'function' && o.id !== undefined;
}
