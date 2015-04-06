/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

import emptyFunction from 'react/lib/emptyFunction';

const SENTINEL = Symbol('placeholder-for-memoized-value');

export default function memoized(target, name, descriptor) {
  let get = descriptor.get;
  let memoizedName = `_memoized_${name}`;
  target[memoizedName] = SENTINEL;
  return {
    ...descriptor,
    get() {
      if (this[memoizedName] === SENTINEL) {
        this[memoizedName] = get.call(this);
      }
      return this[memoizedName];
    }
  };
}
