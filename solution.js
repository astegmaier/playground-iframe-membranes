export function createRevocableProxy(target) {
  const revokeFns = [];
  const proxy = innerCreateRevocableProxy(target, revokeFns);
  return {
    proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokeFns.forEach((revoke) => revoke());
    },
  };
}

function innerCreateRevocableProxy(target, revokeFns) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isPrimitive(originalValue) ? originalValue : innerCreateRevocableProxy(originalValue, revokeFns);
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target, thisArg, argArray);
      return isPrimitive(returnValue) ? returnValue : innerCreateRevocableProxy(returnValue, revokeFns);
    },
  });
  revokeFns.push(revoke);
  return proxy;
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
}
