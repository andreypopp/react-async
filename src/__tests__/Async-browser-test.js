import assert from 'assert';
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import Async from '../Async';

class SubscriptionMock {
  constructor() {
    this.disposed = false;
  }

  dispose() {
    this.disposed = true;
  }
}

class ObservableMock {

  constructor() {
    this.onNext = null;
    this.onError = null;
  }

  subscribe({onNext, onError}) {
    this.onNext = onNext;
    this.onError = onError;
    return new SubscriptionMock();
  }
}

function start() {
  return new ObservableMock();
}

function rerender(component, element) {
  let container = React.findDOMNode(component).parentNode;
  React.render(element, container);
}

function render(element) {
  return TestUtils.renderIntoDocument(element);
}

function unmount(component) {
  let container = React.findDOMNode(component).parentNode;
  React.unmountComponentAtNode(container);
}

describe('AsyncComponent (browser)', function() {

  let renderCount = 0;

  @Async
  class Component extends React.Component {

    constructor(props) {
      super(props);
    }

    static observe(props) {
      return {one: props.observable};
    }

    render() {
      renderCount += 1;
      return <div />;
    }
  }

  beforeEach(function() {
    renderCount = 0;
  });

  it('starts observables on componentWillMount', function() {
    let component = render(<Component observable={{id: 'id', start}} />);
    assert.ok(component.observed);
    assert.ok(component.observed.one);
    let observed = component.observed.one;
    assert.ok(observed.id, 'id');
    assert.ok(observed.observable);
    assert.ok(observed.subscription);
    assert.ok(!observed.subscription.disposed);
    assert.ok(observed.observable.onNext);
    assert.ok(observed.observable.onError);
  });

  it('subscribe to observables on componentWillMount', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={observable} />);
    assert.ok(component.observed);
    assert.ok(component.observed.one);
    let observed = component.observed.one;
    assert.ok(observed.id, 'id');
    assert.ok(observed.observable);
    assert.ok(observed.observable === observable);
    assert.ok(observed.subscription);
    assert.ok(!observed.subscription.disposed);
    assert.ok(observed.observable.onNext);
    assert.ok(observed.observable.onError);
  });

  it('disposes subscriptions on componentWillUnmount', function() {
    let component = render(<Component observable={{id: 'id', start}} />);
    let subscription = component.observed.one.subscription;
    unmount(component);
    assert.ok(subscription.disposed);
  });

  it('disposes subscriptions on componentWillUnmount (when observable passed)', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={observable} />);
    let subscription = component.observed.one.subscription;
    unmount(component);
    assert.ok(subscription.disposed);
  });

  it('disposes old observable and starts new on id change', function() {
    let component = render(<Component observable={{id: 'id', start}} />);
    let prevObserved = component.observed.one;
    assert.ok(!prevObserved.subscription.disposed);
    rerender(component, <Component observable={{id: 'id2', start}} />);
    let nextObserved = component.observed.one;
    assert.ok(prevObserved.subscription.disposed);
    assert.ok(!nextObserved.subscription.disposed);
    unmount(component);
    assert.ok(prevObserved.subscription.disposed);
    assert.ok(nextObserved.subscription.disposed);
  });

  it('disposes an old observable and subscribe on a new one', function() {
    let prevObservable = new ObservableMock();
    let nextObservable = new ObservableMock();
    let component = render(<Component observable={prevObservable} />);
    let prevObserved = component.observed.one;
    assert.ok(!prevObserved.subscription.disposed);
    rerender(component, <Component observable={nextObservable} />);
    let nextObserved = component.observed.one;
    assert.ok(prevObserved.subscription.disposed);
    assert.ok(!nextObserved.subscription.disposed);
    unmount(component);
    assert.ok(prevObserved.subscription.disposed);
    assert.ok(nextObserved.subscription.disposed);
  });
  
  it('keeps observable running if id does not change', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={{id: null, start}} />);
    let prevObserved = component.observed.one;
    assert.ok(!prevObserved.subscription.disposed);
    rerender(component, <Component observable={{id: null, start}} />);
    let nextObserved = component.observed.one;
    assert.ok(!nextObserved.subscription.disposed);
    assert.ok(!prevObserved.subscription.disposed);
    assert.ok(nextObserved.observable === nextObserved.observable);
    assert.ok(nextObserved.subscription === nextObserved.subscription);
    unmount(component);
    assert.ok(nextObserved.subscription.disposed);
    assert.ok(prevObserved.subscription.disposed);
  });

  it('keeps observable running if id does not change (observable passed)', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={observable} />);
    let prevObserved = component.observed.one;
    assert.ok(!prevObserved.subscription.disposed);
    rerender(component, <Component observable={observable} />);
    let nextObserved = component.observed.one;
    assert.ok(!nextObserved.subscription.disposed);
    assert.ok(!prevObserved.subscription.disposed);
    assert.ok(nextObserved.observable === nextObserved.observable);
    assert.ok(nextObserved.subscription === nextObserved.subscription);
    unmount(component);
    assert.ok(nextObserved.subscription.disposed);
    assert.ok(prevObserved.subscription.disposed);
  });

  it('re-renders if data comes out of observable', function() {
    let component = render(<Component observable={{id: 'id', start}} />);
    let observed = component.observed.one;
    assert.equal(renderCount, 1);
    observed.observable.onNext('data');
    assert.equal(renderCount, 2);
    observed.observable.onNext('data2');
    assert.equal(renderCount, 3);
    unmount(component);
  });

  it('re-renders if data comes out of observable (observable passed)', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={observable} />);
    let observed = component.observed.one;
    assert.equal(renderCount, 1);
    observed.observable.onNext('data');
    assert.equal(renderCount, 2);
    observed.observable.onNext('data2');
    assert.equal(renderCount, 3);
    unmount(component);
  });

  it('stores last seen data in observable desc', function() {
    let component = render(<Component observable={{id: 'id', start}} />);
    let observed = component.observed.one;
    assert.strictEqual(observed.data, undefined);
    observed.observable.onNext('data');
    assert.strictEqual(observed.data, 'data');
    observed.observable.onNext('data2');
    assert.strictEqual(observed.data, 'data2');
    unmount(component);
  });

  it('stores last seen data in observable desc (observable passed)', function() {
    let observable = new ObservableMock();
    let component = render(<Component observable={observable} />);
    let observed = component.observed.one;
    assert.strictEqual(observed.data, undefined);
    observed.observable.onNext('data');
    assert.strictEqual(observed.data, 'data');
    observed.observable.onNext('data2');
    assert.strictEqual(observed.data, 'data2');
    unmount(component);
  });

});
