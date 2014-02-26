# React Async

React Async is an addon for React which allows to define and render components
which require a part of its state to be fetched via an asynchronous method (for
example using an XHR request to get data from a server).

We call this type of components *asynchronous components*.

## Concept

In the first place, React Async is a contract for React components which need
part of their state to be fetched asynchronously.

The contract specifies the following requirements:

  * Component can fetch part of its state by specifying
    `getInitialStateAsync(cb)` method which takes Node-style callback function
    as an argument. This method can be called after the initial render.

  * Implementation of `getInitialStateAsync(cb)` can only access properties of
    a component.

  * Component should provide `render()` implementation which can render in
    absence of asynchronous part of a state.

  * The state can be injected into a component by providing `asyncState`
    property. In this case `getInitialStateAsync(cb)` method isn't called.
    This should be used for testing purposes only.

Also React Async provides a mixin which implements such contract and a set of
utilities for working with asynchronous components.

## Installation

React Async is packaged on npm:

    % npm install react-async

## Usage

To create an asynchronous component you use a `ReactAsync.Mixin` mixin and
declare `getInitialStateAsync(cb)` method:

    var React = require('react')
    var ReactAsync = require('react-async')

    var Component = React.createClass({
      mixins: [ReactAsync.Mixin],

      getInitialStateAsync: function(cb) {
        xhr('/api/data', function(data) {
          cb(null, data)
        }.bind(this))
      },

      render: function() { ... }
    })

The method `getInitialStateAsync` mimics `getInitialState` but can fetch state
asynchronously. The result of the function is mixed in into component state.

## Rendering async components on server with fetched async state

The problem arises when you want to render UI on server with React.

While React provides `renderComponentToString` function which can produce markup
for a component, this function is synchronous. That means that it can't be used
when you want to get markup from server populated with data.

React Async provides another function `renderComponentToStringWithAsyncState`
which is asynchronous and triggers `getInitialStateAsync` calls in the component
hierarchy.

First, you'd need to install `fibers` package from npm to use that function:

    % npm install fibers

Then use it like:

    ReactAsync.renderComponentToStringWithAsyncState(
      Component(),
      function(err, markup) {
        // send markup to browser
      })

This way allows you to have asynchronous components arbitrary deep in the
hierarchy.

### Manually injecting fetched state

If you'd need more control over how state is injected into your markup you can
pass a third argument to the `renderComponentToString` callback function which
contains a snapshot of the current server state:

    ReactAsync.renderComponentToStringWithAsyncState(
      Component(),
      function(err, markup, data) {
        ...
      })

You can then do your own manual injection or use the `injectIntoMarkup` method.
In addition to injecting the current server state, `injectIntoMarkup` can also
reference your client script bundles ensuring server state is available before
they are run:

    ReactAsync.renderComponentToStringWithAsyncState(
      Component(),
      function(err, markup, data) {
        res.send(ReactAsync.injectIntoMarkup(markup, data, ['./client.js']))
      })

This produces the following markup:

      ...

      <script>
        window.__reactAsyncStatePacket = {
          ".1p74iy9hgqo.1.0__5": {
            "message":"Hello"
          }
        }
      </script>
      <script src="./client.js"></script>
    </body>

## Utilities

React Async also provides a set of utilities for working with async components.

To check if a component is an asynchronous component:

    ReactAsyncMixin.isAsyncComponent(component)

To prefetch async state of a component:

    ReactAsyncMixin.prefetchAsyncState(component, function(err, component) {
      // ...
    })

It returns a clone of a component with async state injected. Prefetching should
be done before mounting a component into DOM.

