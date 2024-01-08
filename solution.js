export function createRevocableProxy(target) {
  const revocables = [];
  const proxy = innerCreateRevocableProxy(target, revocables);
  return {
    proxy,
    revoke: () => {
      revocables.forEach((r) => r());
      // TODO: maybe try-catch here?
    },
  };
}

function innerCreateRevocableProxy(target, revocables) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isPrimitive(originalValue) ? originalValue : innerCreateRevocableProxy(originalValue, revocables);
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target, thisArg, argArray);
      return isPrimitive(returnValue) ? returnValue : innerCreateRevocableProxy(returnValue, revocables);
    },
  });
  revocables.push(revoke);
  return proxy;
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
}
