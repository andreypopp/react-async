/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import React from 'react';
import injectIntoMarkup from './injectIntoMarkup';

/**
 * An alternative async version of React.renderToString(<Element />) which
 * fetches data for all async components recursively first.
 */
export default function renderToString(element, cb) {
  try {
    var Fiber = require('fibers');
  } catch (err) {
    console.error('ReactAsync.renderToString(): you need to install fibers module with: npm install fibers');
    throw err;
  }

  var fiber = Fiber(function() {
    try {
      Fiber.current.__reactAsyncDataPacket__ = {};

      let data = Fiber.current.__reactAsyncDataPacket__ ;
      let markup = React.renderToString(element);

      // Inject data if callback doesn't receive the data argument
      if (cb.length == 2) {
        markup = injectIntoMarkup(markup, data)
      }

      cb(null, markup, data);
    } catch(e) {
      cb(e)
    } finally {
      delete Fiber.current.__reactAsyncDataPacket__;
    }
  });

  fiber.run();
}
