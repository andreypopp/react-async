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

  _componentFingerprint() {
    let instance = this._reactInternalInstance;
    let rootNodeID = instance._rootNodeID;
    let mountDepth = 0;
    while (instance._currentElement._owner) {
      mountDepth += 1;
      instance = instance._currentElement._owner;
    }
    return `${rootNodeID}__${mountDepth}`;
  }

  _observe(props, state, context) {
    let observed = {...this.constructor.observe(props, state, context)};
    let names = Object.keys(observed);
    for (let i = 0; i < names.length; i++) {
      let name = names[i];
      let o = observed[names[i]];
      invariant(
        o && (o.id !== undefined && typeof o.start === 'function' ||
              typeof o.subscribe === 'function'),
        'observable description should be an observable or provide ' +
        'an object with "id" token and "start" function as properties, ' +
        'but %s observable description of %s component vioaltes this',
        name, this.constructor.name
      );
      if (o && typeof o.subscribe === 'function') {
        let observable = o;
        o = {
          id: observable,
          start() {
            return observable;
          }
        };
      }
      observed[name] = o;
    }
    return observed;
  }

  _startObservables(props, state, context) {
    let fingerprint = this._componentFingerprint();
    let shouldWaitForTick = (
      Fiber !== undefined &&
      Fiber.current !== undefined &&
      Fiber.current.__reactAsyncDataPacket__ !== undefined
    );
    // we need to assign to this now because onNext can be synchronously called
    this.observed = this._observe(props, state, context);
    let nextNames = Object.keys(this.observed);
    let storedObserved = retrieveObservedInfo(fingerprint);
    for (let i = 0; i < nextNames.length; i++) {
      let name = nextNames[i];
      let next = this.observed[name];
      let stored = storedObserved[name];
      if (stored) {
        next.id = stored.id;
        next.data = stored.data;
        next.completed = stored.completed;
      }
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
    }

    if (shouldWaitForTick) {
      this.observed = waitForTick(this.observed);
      storeObservedInfo(fingerprint, this.observed);
    };
  }

  _reconcileObservables(props, state, context) {
    let prevObserved = this.observed;
    this.observed = this._observe(props, state, context);
    let prevNames = Object.keys(prevObserved);
    let nextNames = Object.keys(this.observed);

    // reconcile new observed dictionary
    for (let i = 0; i < nextNames.length; i++) {
      let name = nextNames[i];
      let prev = prevObserved[name];
      let next = this.observed[name];
      if (prev !== undefined && prev.id === next.id) {
        this.observed[name] = prev;
      } else {
        prev.subscription.dispose();
        next.observable = next.start();
        next.subscription = next.observable.subscribe({
          onNext: this._onNext.bind(this, name),
          onCompleted: this._onCompleted.bind(this, name),
          onError: this._onError.bind(this, name)
        });
        this.observed[name] = next;
      }
    }

    // cancel prev observed which were not mentioned in next observed
    for (let i = 0; i < prevNames.length; i++) {
      let name = prevNames[i];
      if (nextNames.indexOf(name) === -1) {
        prevObserved[prevName].subscription.dispose();
      }
    }
  }

  _onNext(name, data) {
    this.observed[name].data = data;
    this.forceUpdate();
  }

  _onCompleted(name) {
    this.observed[name].subscription.dispose();
  }

  _onError(name, err) {
    // TODO: we need a way to propagate errors up back
    console.error(`error in observable "${name}" of ${this.constructor.name} component`);
    throw err;
  }

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
