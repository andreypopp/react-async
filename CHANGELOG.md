##

  - `ReactAsync.renderComponentToString` now can accept callback w/ 3rd argument
    `data`. In this case data will not be injected automatically into the
    markup.

  - `ReactAsync.injectIntoMarkup(markup, data, scripts)` to inject data into
    markup as JSON blob and a list of scripts (URLs) as <script> elements.

## 0.4.0

  - Upgrade for React 0.9.0.

  - React is now a peer dependency of react-async.
