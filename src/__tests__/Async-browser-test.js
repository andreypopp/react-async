import assert from 'assert';
import React from 'react';
import TestUtils from 'react/lib/ReactTestUtils';
import Async from '../Async';

class DummyProcess {

  constructor() {
    this.cancelled = false;
    this.onNext = null;
    this.onError = null;
  }

  then(onNext, onError) {
    this.onNext = onNext;
    this.onError = onError;
  }

  cancel() {
    this.cancelled = true;
  }
}

function start() {
  return new DummyProcess();
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

    static processes(props) {
      return {process: props.process};
    }

    render() {
      renderCount += 1;
      return <div />;
    }
  }

  beforeEach(function() {
    renderCount = 0;
  });

  it('starts processes on componentWillMount', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    assert.ok(component.processes);
    assert.ok(component.processes.process);
    let processDesc = component.processes.process;
    assert.ok(processDesc.id, 'id');
    assert.ok(processDesc.process);
    let process = processDesc.process;
    assert.ok(!process.cancelled);
    assert.ok(process.onNext);
    assert.ok(process.onError);
  });

  it('cancels processes on componentWillUnmount', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    let process = component.processes.process.process;
    unmount(component);
    assert.ok(process.cancelled);
  });

  it('cancels old process and starts new on id change', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    let prevProcess = component.processes.process.process;
    assert.ok(!prevProcess.cancelled);
    rerender(component, <Component process={{id: 'id2', start}} />);
    let nextProcess = component.processes.process.process;
    assert.ok(prevProcess.cancelled);
    assert.ok(!nextProcess.cancelled);
    unmount(component);
    assert.ok(nextProcess.cancelled);
    assert.ok(prevProcess.cancelled);
  });

  it('keeps process running if id does not change', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    let prevProcess = component.processes.process.process;
    assert.ok(!prevProcess.cancelled);
    rerender(component, <Component process={{id: 'id', start}} />);
    let nextProcess = component.processes.process.process;
    assert.ok(!prevProcess.cancelled);
    assert.ok(!nextProcess.cancelled);
    assert.ok(prevProcess === nextProcess);
    unmount(component);
    assert.ok(nextProcess.cancelled);
    assert.ok(prevProcess.cancelled);
  });

  it('re-renders if data comes out of process', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    let process = component.processes.process.process;
    assert.equal(renderCount, 1);
    process.onNext('data');
    assert.equal(renderCount, 2);
    process.onNext('data2');
    assert.equal(renderCount, 3);
    unmount(component);
  });

  it('stores last seen data in process desc', function() {
    let component = render(<Component process={{id: 'id', start}} />);
    let process = component.processes.process.process;
    assert.strictEqual(component.processes.process.data, undefined);
    process.onNext('data');
    assert.strictEqual(component.processes.process.data, 'data');
    process.onNext('data2');
    assert.strictEqual(component.processes.process.data, 'data2');
    unmount(component);
  });

});
