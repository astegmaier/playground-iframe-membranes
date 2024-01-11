export const createMembrane: CreateMembraneFunction = (target) => {
  const revokeFnsCache = new RevokeFnsCache();
  const proxy = createRevocableProxy(target, revokeFnsCache);
  return {
    membrane: proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokeFnsCache.revokeAll();
    },
  };
};

function createRevocableProxy<T extends object>(target: T, revokeFnsCache: RevokeFnsCache) {
  const { proxy, revoke }: { proxy: T; revoke: () => void } = Proxy.revocable<T>(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isObject(originalValue) ? createRevocableProxy(originalValue, revokeFnsCache) : originalValue;
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target as any, thisArg, argArray);
      return isObject(returnValue) ? createRevocableProxy(returnValue, revokeFnsCache) : returnValue;
    },
  });
  revokeFnsCache.add(proxy, revoke);
  return proxy;
}

function isObject(value: unknown): value is object {
  // TODO: are there any edge cases to consider here?
  return (typeof value === "object" && value !== null) || typeof value === "function";
}

/**
 * Stores revoke functions for all the proxies created by the membrane.
 * The problem we are trying to solve here is that revoke functions keep references to their proxies (before they are called).
 * So if we kept a _hard_ reference to the revoke function, it would keep the proxy alive for longer than it needs to be.
 * (i.e. if there are no other references to it besides the revoke function, we don't want to stop it from being gc'd).
 * But if we only keep a _weak_ reference to the revoke function, the function itself would get gc'd at the first opportunity,
 * which would mean that we wouldn't have a means to revoke the still-alive proxies.
 * This solution uses a WeakMap to link the lifetime of the proxy to the lifetime of the revoke function.
 * WeakMaps are not iterable, though, so we also have to keep a separate array of WeakRefs to the revoke functions.
 */
class RevokeFnsCache {
  private proxyToRevokeFn = new WeakMap<object, () => void>();
  private revokeFnWeakRefs: WeakRef<() => void | undefined>[] = [];
  add(proxy: object, revokeFn: () => void) {
    this.proxyToRevokeFn.set(proxy, revokeFn);
    this.revokeFnWeakRefs.push(new WeakRef(revokeFn));
  }
  revokeAll() {
    this.revokeFnWeakRefs.forEach((revokeFnWeakRef) => revokeFnWeakRef.deref()?.());
  }
}
