export function createMembrane(target) {
  const revokeFns = [];
  const proxy = createRevocableProxy(target, revokeFns);
  return {
    target: proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokeFns.forEach((revoke) => revoke());
    },
  };
}

function createRevocableProxy(target, revokeFns) {
  const { proxy, revoke } = Proxy.revocable(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isPrimitive(originalValue) ? originalValue : createRevocableProxy(originalValue, revokeFns);
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target, thisArg, argArray);
      return isPrimitive(returnValue) ? returnValue : createRevocableProxy(returnValue, revokeFns);
    },
  });
  revokeFns.push(revoke);
  return proxy;
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
}
