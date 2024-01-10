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

class RevokeFnsCache {
  // Key: proxy, Value: revokeFn. WeakMaps retain references to their _values_ for as long as the key is not gc'd.
  // This way, we ensure that the revokeFn lives for as long as the proxy - if the proxy gets gc'd, there's no point in garbage collecting it.
  proxyToRevokeFn = new WeakMap();
  revokeFnWeakRefs = [];
  add(proxy, revokeFn) {
    this.proxyToRevokeFn.set(proxy, revokeFn);
    this.revokeFnWeakRefs.push(new WeakRef(revokeFn));
  }
  revokeAll() {
    this.revokeFnWeakRefs.forEach((revokeFnWeakRef) => revokeFnWeakRef.deref()?.());
  }
}
