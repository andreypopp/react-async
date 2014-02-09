# react-async

Async rendering for React components.

## Installation

Install via npm:

    % npm install react-async

## Usage

Use `ReactAsync.createClass(...)` to create a component which initialises
a part of its state via async method `getInitialStateAsync(cb)`:

    var AsyncComponent = ReactAsync.createClass({
      getInitialStateAsync: function(cb) {
        xhr('/api/data', cb)
      },

      render: function() {
        ...
      },

      ...
    })

Method `getInitialStateAsync(cb)` is similar to `getInitialState()` but instead
returns a result via callback which allows you to use asynchronous functions to
get data from database or from remote HTTP API.

Then on server you can use `ReactAsync.renderComponentToString(component, cb)`
function to get the markup:

    ReactAsync.renderComponentToString(AsyncComponent(), function(err, markup) {
      res.send(markup)
    })

Note that `AsyncComponent` components is not required to be at the top level of
component hierarchy, it can be deep inside it.

## Example

The examples code is located at `example` directory. You can clone this
repository and run `make install example` and point your web browser to
`http://localhost:3000`.
