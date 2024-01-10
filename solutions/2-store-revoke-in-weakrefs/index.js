export function createMembrane(target) {
  const revokeFnsCache = new RevokeFnsCache();
  const proxy = createRevocableProxy(target, revokeFnsCache);
  return {
    target: proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokeFnsCache.revokeAll();
    },
  };
}

function createRevocableProxy(target, revokeFnsCache) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isPrimitive(originalValue) ? originalValue : createRevocableProxy(originalValue, revokeFnsCache);
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target, thisArg, argArray);
      return isPrimitive(returnValue) ? returnValue : createRevocableProxy(returnValue, revokeFnsCache);
    },
  });
  revokeFnsCache.add(proxy, revoke);
  return proxy;
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
}

/**
 * Stores revoke functions for all the proxies created by the membrane.
 * The problem we are trying to solve here is that revoke functions keep references to their proxies (before they are called and the proxy is revoked).
 * So if we kept a _hard_ reference to the revoke function, it would keep the proxy alive for longer than it needs to be.
 * (i.e. if there are no other references to it besides the revoke function, we don't want to stop it from being gc'd).
 * But if we only keep a _weak_ reference to the revoke function, the function itself would get gc'd at the first opportunity, which would mean that we wouldn't have a means to revoke the still-alive proxies.
 * This solution uses a WeakMap to link the lifetime of the proxy to the lifetime of the revoke function.
 * WeakMaps are not iterable, though, so we also have to keep a separate array of WeakRefs to the revoke functions.
 */
class RevokeFnsCache {
  proxyToRevokeFn = new WeakMap(); // Key: proxy, Value: revokeFn.
  revokeFnWeakRefs = [];
  add(proxy, revokeFn) {
    this.proxyToRevokeFn.set(proxy, revokeFn);
    this.revokeFnWeakRefs.push(new WeakRef(revokeFn));
  }
  revokeAll() {
    this.revokeFnWeakRefs.forEach((revokeFnWeakRef) => revokeFnWeakRef.deref()?.());
  }
}
