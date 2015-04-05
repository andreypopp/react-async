# React Async

React Async provides a way for React components to asynchronously fetch data.

## Installation

React Async is packaged on npm:

    % npm install react-async

## Basic usage

React Async provides a higer-order component which wraps a regular React
component and process data specification defined as `processes` class property:

    import {Component} from 'react';
    import {Async, promise} from 'react-async';

    @Async
    class MyComponent extends Component {

      static processes = {
        user(props, state) {
          return promise(
            key: props.userID,
            start() {
              return xhr(`/api/user?user=${props.userID}`)
            }
          }
        }
      }

      render() {
        let {user} = this.data
        ...
      }

    }

As we can in `render()` method we can reference fetched data through
`this.data.user`.

## Process specifications

Process specifications in React Async are functions of components' `props` and
`state` which return an asynchronous process description which consist of `key`
and a `start()` method.

The `key` property is used to determine when a currently running process should
be destroyed and a new one started.

The `start()` method should start a new process and it.

A process is an object with methods `then(onStep, onError)` and `cancel()`.

The `then(onStep, onError)` method is used to subscribe for a process execution.
The `onStep` callback is called on every new item in a process while `onError`
is called on error conditions.

The `cancel()` method is used to stop execution of a process.

Now that definition of process is pretty abstract and that is intentionally. The
definitions covers such abstractions like promises, streams, observables and so
on.

## Rendering async components on server with fetched async state

While React provides `renderToString(element)` function which can produce markup
for a component, this function is synchronous. That means that it can't be used
when you want to get markup from server populated with data.

React Async provides another version of `renderToString(element)` which is
asynchronous and fetches all data defined in data specifications before
rendering a passed component tree

First, you'd need to install `fibers` package from npm to use that function:

    % npm install fibers

Then use it like:

    import renderToString from 'react-async';

    renderToString(
      <Component />,
      function(err, markup) {
        // send markup to browser
      })

This way allows you to have asynchronous components arbitrary deep in the
hierarchy.
