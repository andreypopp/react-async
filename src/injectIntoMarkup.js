/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import asciiJSON from 'ascii-json';

/**
 * Inject data and optional client scripts into markup.
 */
export default function injectIntoMarkup(markup, data, scripts) {
  let escapedJson = asciiJSON.stringify(data).replace(/<\//g, '<\\/');
  let injected = `<script>window.__reactAsyncDataPacket__ = ${escapedJson}</script>`;

  if (scripts) {
    injected += scripts
      .map(script => `<script src="${script}"></script>`)
      .join('');
  }

  if (markup.indexOf('</body>') > -1) {
    return markup.replace('</body>', injected + '$&');
  } else {
    return markup + injected;
  }
}
