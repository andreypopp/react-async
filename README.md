# React Async

**VERSION DESCRIBED IN THIS DOCUMENT IS NOT RELEASED YET**

React Async provides a way for React components to subscribe for observable
values.

## Installation

React Async is packaged on npm:

    % npm install react-async

## Basic usage

React Async provides a component decorator `@Async` which given a set of
observable specifications wraps a regular React component and returns a new one
which subscribes to observables and re-renders the component when new data
arrives.

The basic example looks like:

    import React from 'react';
    import Async from 'react-async';
    import Rx from 'rx';

    function defineXHRObservable(url) {
      return {
        id: url,
        start() {
          return Rx.fromPromise(fetch(url))
        }
      }
    }

    function MyComponentObservables(props) {
      return {
        user: defineXHRObservable(`/api/user?user${props.userID}`)
      }
    }

    @Async(MyComponentObservables)
    class MyComponent extends React.Component {

      render() {
        let {user} = this.props
        ...
      }

    }

The `@Async` decorator injects data from observables via props so in `render()`
method of `<MyComponent />` the `user` property will contain the data fetched
via XHR.

## Rendering async components on server with fetched async state

While React provides `renderToString(element)` function which can produce markup
for a component, this function is synchronous. That means that it can't be used
when you want to get markup from server populated with data.

React Async provides another version of `renderToString(element)` which is
asynchronous and fetches all data defined in observable specifications before
rendering a passed component tree.

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
