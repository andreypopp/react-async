## 0.7.0

  - Bump react dep to 0.10.0.

## 0.6.1

  - Fix bug with updating injected state (via asyncState prop).

## 0.6.0

  - Fibers are now optional, they are only needed if you want to pre-render
    React components by fetching async state recursively, e.g. using
    `ReactAsync.renderComponentToStringWithAsyncState`

  - `ReactAsync.createClass` is removed, use `React.createClass` with
    `ReactAsync.Mixin` mixin instead.

  - `ReactAsync.renderComponent` is removed, use `React.renderComponent`
    instead.

  - `ReactAsync.renderComponentToString` is renamed to
    `ReactAsync.renderComponentToStringWithAsyncState`

  - Add `ReactAsync.isAsyncComponent` to test if a component is an async
    component.

  - Add `ReactAsync.prefetchAsyncState` to prefetch state of an async component.

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
