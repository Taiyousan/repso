/**
 * Returns `next`, with every part deeply equal to the same part of `previous` replaced by that
 * part of `previous`. Live reads build new objects on every write: keeping what didn't change lets
 * memoized components skip it, and a result equal to the previous one is `previous` itself.
 * Plain objects, arrays and dates are compared by value; anything else (Map, Set…) by reference.
 */
export function shareEqual<T>(previous: unknown, next: T): T {
  if (Object.is(previous, next)) return next;

  if (previous instanceof Date && next instanceof Date) {
    return previous.getTime() === next.getTime() ? (previous as T) : next;
  }

  if (Array.isArray(previous) && Array.isArray(next)) {
    let equal = previous.length === next.length;
    const shared = next.map((item, index) => {
      const value = shareEqual(previous[index], item);
      if (value !== previous[index]) equal = false;
      return value;
    });
    return (equal ? previous : shared) as T;
  }

  if (isPlainObject(previous) && isPlainObject(next)) {
    const keys = Object.keys(next);
    let equal = keys.length === Object.keys(previous).length;
    const shared: Record<string, unknown> = {};
    for (const key of keys) {
      const value = shareEqual(previous[key], next[key]);
      if (value !== previous[key] || !(key in previous)) equal = false;
      shared[key] = value;
    }
    return (equal ? previous : shared) as T;
  }

  return next;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
