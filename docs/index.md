# React Async

React Async is an addon for React which allows to define and render components
which require a part of its state to be fetched via an asynchronous method (for
example using an XHR request to get data from a server).

We call this type of components *asynchronous components*.

## Motivation

While this type of functionality is trivial to implement in React without an
addon:

    var Component = React.createClass({

      componentDidMount: function() {
        xhr('/api/data', function(data) {
          this.setState(data)
        }.bind(this))
      },

      render: function() { ... }
    })

The problem arises when you want to render UI on server with React. Lifecycle
callback `componentDidMount` is executed only in a browser. That means that this
approach isn't suitable when you want to get markup from server populated with
data.

Another solution would be to define a static method on your top-level component
which would fetch data before rendering component hierarchy. But that limits you
to have only top-level components be able to fetch its state.

React Async allows you to have asynchronous components arbitrary deep in the hierarchy.

## Installation

React Async is packaged on npm:

    % npm install react-async

## Usage

To create an asynchronous component you use a `createClass` function exported by React
Async which is similar to `React.createClass`:

    var React = require('react')
    var ReactAsync = require('react-async')

    var Component = ReactAsync.createClass({

      getInitialStateAsync: function(cb) {
        xhr('/api/data', function(data) {
          cb(data)
        }.bind(this))
      },

      render: function() { ... }
    })

The main thing to notice is `getInitialStateAsync` callback which mimics
`getInitialState` but can fetch state asynchronously. The result of the function
is mixed in into component state.

### Rendering asynchronous components in Node.js

To render an asynchronous components in Node you use `renderComponentToString`
function exported by React Async:

    ReactAsync.renderComponentToString(Component(), function(err, markup) {
      // send markup to browser or ...
    })

This function is similar to `React.renderComponentToString` but ensures that all
`getInitialStateAsync` callbacks of asynchronous components executed before the
resulted markup is returned.

It also embeds fetched state in the markup as a JSON blob, so when you
initialize React components in browser it won't need to do any XHR requests.

### Rendering asynchronous components in browser

To render an asynchronous components in a browser you use `renderComponent`
function exported by React Async:

    ReactAsync.renderComponent(Component(), document.body)

Using this function instead of `React.renderComponent` allows asynchronous
components to pick up state delivered from server That way there's no need to do
additional XHR requests.

