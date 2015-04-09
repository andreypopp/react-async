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

const DUMMY_OBSERVABLE = {
  subscribe: emptyFunction
};

const DUMMY_SUBSCRIPTION = {
  dispose: emptyFunction
};

export default class AsyncComponent extends React.Component {

  static observe(props, state, context) {
    invariant(
      false,
      'AsyncComponent subclass should implement observe() class method'
    );
  }

  constructor(props) {
    super(props);
    this._skipObservedReconciliation = true;
    this.observed = null;
  }

  setState(nextState, cb) {
    this._skipObservedReconciliation = false;
    super.setState(nextState, cb);
  }

  componentWillMount() {
    this._startObservables(this.props, this.state, this.context);
  }

  componentWillReceiveProps() {
    this._skipObservedReconciliation = false;
  }

  componentWillUpdate(props, state, context) {
    if (!this._skipObservedReconciliation) {
      this._reconcileObservables(props, state, context);
    }
  }

  componentDidUpdate() {
    this._skipObservedReconciliation = true;
  }

  componentWillUnmount() {
    for (let name in this.observed) {
      this.observed[name].subscription.dispose();
    }
    this.observed = null;
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

  _startObservables(props, state, context) {
    // we need to assign to this now because onNext can be synchronously called
    this.observed = {...this.constructor.observe(props, state, context)};
    let shouldWaitForTick = checkShouldWaitForTick();
    let nextNames = Object.keys(this.observed);
    let storedObserved = retrieveObservedInfo(this._fingerprint);
    for (let i = 0; i < nextNames.length; i++) {
      let name = nextNames[i];
      let next = this.observed[name];
      validatedObserved(this.constructor.name, name, next);
      next = {
        ...next,
        ...storedObserved[name]
      };
      if (shouldWaitForTick) {
        next.observable = next.start();
      } else if (ExecutionEnvironment.canUseDOM) {
        if (!next.completed) {
          next.observable = next.start(next.data);
          next.subscription = next.observable.subscribe({
            onNext: this._onNext.bind(this, name),
            onCompleted: this._onCompleted.bind(this, name),
            onError: this._onError.bind(this, name)
          });
        } else {
          next.observable = DUMMY_OBSERVABLE;
          next.subscription = DUMMY_SUBSCRIPTION;
        }
      }
      this.observed[name] = next;
    }

    if (shouldWaitForTick) {
      this.observed = waitForTick(this.observed);
      storeObservedInfo(this._fingerprint, this.observed);
    };
  }

  _reconcileObservables(props, state, context) {
    let nextObserved = {...this.constructor.observe(props, state, context)};
    let prevObserved = this.observed;
    let prevNames = Object.keys(prevObserved);
    let nextNames = Object.keys(nextObserved);

    // reconcile new observed dictionary
    for (let i = 0; i < nextNames.length; i++) {
      let name = nextNames[i];
      let prev = prevObserved[name];
      let next = nextObserved[name];
      validatedObserved(this.constructor.name, name, next);
      if (prev !== undefined && prev.id === next.id) {
        nextObserved[name] = prev;
      } else {
        prev.subscription.dispose();
        next = {...next};
        next.observable = next.start();
        next.subscription = next.observable.subscribe({
          onNext: this._onNext.bind(this, name),
          onCompleted: this._onCompleted.bind(this, name),
          onError: this._onError.bind(this, name)
        });
        nextObserved[name] = next;
      }
    }

    // cancel old observed which were not mentioned in nextObserved
    for (let i = 0; i < prevNames.length; i++) {
      let name = prevNames[i];
      if (nextNames.indexOf(name) === -1) {
        prevObserved[prevName].subscription.dispose();
      }
    }

    // update observed dictionary
    this.observed = nextObserved;
  }

  _onNext(name, data) {
    this.observed[name].data = data;
    this.forceUpdate();
  }

  _onCompleted(name) {
    // TODO: why it's useful?
  }

  _onError(name, err) {
    // TODO: we need a way to propagate errors up back
    console.error(`error in observable "${name}" of ${this.constructor.name} component`);
    throw err;
  }

}

function checkShouldWaitForTick() {
  return (
    Fiber !== undefined &&
    Fiber.current !== undefined &&
    Fiber.current.__reactAsyncDataPacket__ !== undefined
  );
}

function validatedObserved(componentName, name, observed) {
  invariant(
    observed.id !== undefined,
    'observable description should provide an "id" property ' +
    'but observable description %s of %s component does not have it',
    name, componentName
  );
  invariant(
    typeof observed.start === 'function',
    'observable description should provide a start() function ' +
    'but observable description %s of %s component does not have it',
    name, componentName
  );
}

function waitForTick(observed) {
  let nextObserved = {};
  let completed = {};
  let futures = [];
  for (let name in observed) {
    let o = observed[name];
    nextObserved[name] = {...o};
    let future = waitForNext(name, o.observable, {
      onNext(name, data) {
        nextObserved[name].data = data;
      },
      onCompleted(name) {
        nextObserved[name].completed = true;
      },
      onError(name, err) {

      }
    });
    futures.push(future);
  }
  Future.wait.apply(Future, futures);
  return nextObserved;
}

function waitForNext(name, observable, observer) {
  let subscription;
  let scheduled = false;
  let makeFuture = Future.wrap((cb) => {
    subscription = observable.subscribe({
      onNext(data) {
        observer.onNext(name, data);
        // we defer resolution to next tick so onCompleted has a chance to
        // execute
        if (!scheduled) {
          scheduled = true;
          process.nextTick(function() {
            cb(null);
          });
        };
      },
      onCompleted() {
        observer.onCompleted(name);
      },
      onError(err) {
        observer.onError(name, err);
        if (!scheduled) {
          scheduled = true;
          cb(err);
        };
      }
    });
  })
  let future = makeFuture();
  future.resolve(function() {
    subscription.dispose();
  });
  return future;
}

function retrieveObservedInfo(key) {
  if (!ExecutionEnvironment.canUseDOM || window.__reactAsyncDataPacket__ === undefined) {
    return {};
  } else {
    return window.__reactAsyncDataPacket__[key] || {};
  }
}

function storeObservedInfo(key, observed) {
  let packet = {};
  for (let name in observed) {
    let {id, data, completed} = observed[name];
    completed = !!completed;
    packet[name] = {id, data, completed};
  }
  Fiber.current.__reactAsyncDataPacket__[key] = packet;
}
