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
    as an argument.

  * Implementation of `getInitialStateAsync(cb)` can only access properties of
    a component.

  * Component should provide `render()` implementation which can render in
    absence of asynchronous part of the state.

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
asynchronously. The result of the function is mixed in into the component state.

## Deferring rendering of async components

If you want to render different async components in the same DOM node and don't
want to unmount already rendered component unless async state of the next
component is fetched, there's `<Preloaded />` component which handles that:

    <Preloaded>
      {this.renderAsyncTabContents({url: this.state.url})
    </Preloader>

It accepts only a single child and only that single child could be an async
component. On first render it would render its child as-is but on subsequent
renders it would defer rendering unless async state is prefetched.

If you want to defer first render unless async state is fetched you should
provide a `preloader` prop:

    <Preloaded preloader={Spinner()}>
      {this.renderAsyncTabContents({url: this.state.url})
    </Preloader>

You also can force preloader on subsequent renders with `alwayUsePreloader`
prop:

    <Preloaded preloader={Spinner()} alwayUsePreloader>
      {this.renderAsyncTabContents({url: this.state.url})
    </Preloader>

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
pass a third argument to the `renderComponentToStringWithAsyncState` callback
function which contains a snapshot of the current server state:

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

### Custom state serialization and deserialization

You can provide `stateToJSON(state)` and `stateFromJSON(data)` methods to
customize how async state is serialized/deserialized when it is transfered to a
browser from a server.

That allows keeping objects in state which are not POJSOs (Plain JS Objects),
for example:

    ...

    getInitialStateAsync: function(cb) {
      cb(null, {message: new Message('Hello')})
    },

    stateFromJSON: function(state) {
      return {message: new Message(state.message.msg)}
    },

    stateToJSON: function(state) {
      return {message: {msg: state.message.msg}}
    },

    render: function() {
      return (
        <div>
          {this.state.message ? this.state.message.say() || 'Loading'}
        </div>
      )
    },

    ...

Where `Message` is a class defined as:

    function Message(msg) {
      this.msg = msg
    }

    Message.prototype.say = function() {
      return this.msg
    }

## API reference

#### **ReactAsync.Mixin**

Components which uses this mixin should define `getInitialStateAsync(cb)` method
to fetch a part of its state asynchronously.

Optionally components could define `stateToJSON(state)` and
`stateFromJSON(data)` methods to customize how state serialized and deserialized
when it's transfered to a browser.

#### **ReactAsync.renderComponentToStringWithAsyncState(component, cb)**

Renders component to a markup string while  calling `getInitialStateAsync(cb)`
method of asynchronous components in the component hierarchy.

This guarantees that components will have their state fetched before calling its
`render()` method.

Callback `cb` is called with either two or three arguments (depending on the
arity of the callback itself).

In the case of two arguments `err` and `markup`, async state data will already be
injected into `markup` to reproduce the same UI in a browser.

In the case of three arguments `err`, `markup` and `data`, an API consumer should
inject data manually (for example using `injectIntoMarkup(markup, data,
scripts)` function.

You'd need to have `fibers` package from npm installed to use this function:

    % npm install fibers

#### **ReactAsync.isAsyncComponent(component)**

Returns `true` if a `component` is an asynchronous component.

#### **ReactAsync.prefetchAsyncState(component, cb)**

Prefetch the asynchronous state of a `component` by calling its
`getInitialStateAsync(cb)` method. Note that only an async state of the
component itself would be prefetched but not of its children.

Callback `cb` is called with two arguments `err` and `component`, where
`component` is a clone of a original component with its state injected.

Prefetching should be done before mounting a component into DOM.

#### **ReactAsync.injectIntoMarkup(markup, data, scripts)**

Inject `data` into `markup` as JSON blob. Data will be injected as:

    window.__reactAsyncStatePacket = { ... }

This allows to transfer asynchronous state fetched on server to browser. That
way components in browser won't need to call `getInitialStateAsync(cb)` method
once more on first render.

If `scripts` is passed and is an array then inject `<script src="..."></script>`
into the `markup` for each element of the array.
