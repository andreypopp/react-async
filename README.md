# React Async

React Async provides a way for React components to asynchronously fetch data
from different sources.

The API is built around the notion of processes which covers a lot of use cases
from waiting for a promise to be resolved to subscribing to data streams and
observables.

## Installation

React Async is packaged on npm:

    % npm install react-async

## Basic usage

React Async provides a component decorator `@Async` which given a set of process
descriptions wraps a regular React component and returns a new one which
executes processes and re-renders the component when new data arrives.

The basic example looks like:

    import React from 'react';
    import Async from 'react-async';

    function defineXHRProcess(url) {
      return {
        id: url,
        start() {
          return fetch(url)
        }
      }
    }

    function MyComponentProcesses(props) {
      return {
        user: defineXHRProcess(`/api/user?user${props.userID}`)
      }
    }

    @Async(MyComponentProcesses)
    class MyComponent extends React.Component {

      render() {
        let {user} = this.props
        ...
      }

    }

The `@Async` decorator injects data from processes via props so in `render()`
method of `<MyComponent />` the `user` property will contain the data fetched
via XHR.

## Process specifications

Process specifications in React Async are functions of components' `props` which
return an process descriptions which should consist at least of a `id` property
and a `start()` method.

The `id` property is used to determine when a currently running process should
be destroyed and a new one started.

The `start()` method should start a new process and return an actual process
object.

A process is an object with methods `then(onNext, onError)` and `cancel()`.

The `then(onNext, onError)` method is used to subscribe for a process execution.
The `onNext` callback is called on every new item in a process while `onError`
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

    import {renderToString} from 'react-async';

    renderToString(
      <Component />,
      function(err, markup) {
        // send markup to browser
      })

This way allows you to have asynchronous components arbitrary deep in the
hierarchy.
