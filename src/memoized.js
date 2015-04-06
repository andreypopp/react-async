/**
 * @copyright 2015 Andrey Popp <8mayday@gmail.com>
 */

const SENTINEL = Symbol('placeholder-for-memoized-value');

/**
 * Decorator for computed properties which memoize its value on first
 * computation.
 */
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
