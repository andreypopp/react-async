/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import invariant from 'react/lib/invariant';
import Async from './Async';

export default Async;
export {Async, renderToString, injectIntoMarkup};

function renderToString() {
  invariant(
    false,
    'ReactAsync.renderToString(): this function can be used only in Node.js/Io.js execution environment'
  );
}

function injectIntoMarkup() {
  invariant(
    false,
    'ReactAsync.injectIntoMarkup(): this function can be used only in Node.js/Io.js execution environment'
  );
}
