export function createRevocableProxy(target) {
  // The revoke function maintains a connection to its associated proxy until it is called.
  // If a proxy gets garbage collected, there is no point in revoking it - we use weak refs to allow this to happen.
  const revokableFnWeakRefs = [];
  const proxy = innerCreateRevocableProxy(target, revokableFnWeakRefs);
  return {
    proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokableFnWeakRefs.forEach((weakRef) => weakRef.deref()?.());
    },
  };
}

function innerCreateRevocableProxy(target, revokableFnWeakRefs) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isPrimitive(originalValue) ? originalValue : innerCreateRevocableProxy(originalValue, revokableFnWeakRefs);
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target, thisArg, argArray);
      return isPrimitive(returnValue) ? returnValue : innerCreateRevocableProxy(returnValue, revokableFnWeakRefs);
    },
  });
  revokableFnWeakRefs.push(new WeakRef(revoke));
  return proxy;
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
}
