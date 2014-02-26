## 0.6.0

  - Fibers are now optional, they are only needed if you want to pre-render
    React components by fetching async state recursively, e.g. using
    ReactAsync.renderComponentToStringWithAsyncState

  - Remove ReactAsync.createClass, React.createClass with ReactAsync.Mixin
    should be used instead.

  - Remove ReactAsync.renderComponent, React.renderComponent should be used
    instead

  - Rename ReactAsync.renderComponentToString to
    ReactAsync.renderComponentToStringWithAsyncState

  - Add ReactAsync.isAsyncComponent

  - Add ReactAsync.prefetchAsyncState

## 0.5.1

  - Check if async component is still mounted before updating its state from and
    async call.

## 0.5.0

  - `ReactAsync.renderComponentToString` now can accept callback w/ 3rd argument
    `data`. In this case data will not be injected automatically into the
    markup.

  - `ReactAsync.injectIntoMarkup(markup, data, scripts)` to inject data into
    markup as JSON blob and a list of scripts (URLs) as <script> elements.

## 0.4.0

  - Upgrade for React 0.9.0.

  - React is now a peer dependency of react-async.
