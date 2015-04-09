/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import invariant from 'react/lib/invariant';
import injectIntoMarkup from './injectIntoMarkup';

let Fiber;
try {
  Fiber = require('fibers');
} catch(err) {
  // do nothing
}

/**
 * An alternative async version of React.renderToString(<Element />) which
 * fetches data for all async components recursively first.
 */
export default function renderToString(element, cb) {
  invariant(
    Fiber !== undefined,
    'ReactAsync.renderToString(): cannot import "fibers" package, ' +
    'you need to have it installed to use this function. ' +
    'Install it by running the following command "npm install fibers" ' +
    'in the project directory.'
  );

  let fiber = Fiber(function() {
    try {
      Fiber.current.__reactAsyncDataPacket__ = {};

      let data = Fiber.current.__reactAsyncDataPacket__;
      let markup = React.renderToString(element);

      // Inject data if callback doesn't receive the data argument
      if (cb.length === 2) {
        markup = injectIntoMarkup(markup, data);
      }

      cb(null, markup, data);
    } catch(e) {
      cb(e);
    } finally {
      delete Fiber.current.__reactAsyncDataPacket__;
    }
  });

  fiber.run();
}
