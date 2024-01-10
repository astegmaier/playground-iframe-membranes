export function createMembrane(target: object) {
  const revokeFns: Array<() => void> = [];
  const proxy = createRevocableProxy(target, revokeFns);
  return {
    membrane: proxy,
    // TODO: maybe try-catch here?
    revoke: () => {
      revokeFns.forEach((revoke) => revoke());
    },
  };
}

function createRevocableProxy<T extends object>(target: T, revokeFns: Array<() => void>) {
  const { proxy, revoke }: { proxy: T; revoke: () => void } = Proxy.revocable<T>(target, {
    get(target, name) {
      const originalValue = Reflect.get(target, name);
      return isObject(originalValue) ? createRevocableProxy(originalValue, revokeFns) : originalValue;
    },
    apply(target, thisArg, argArray) {
      const returnValue = Reflect.apply(target as any, thisArg, argArray);
      return isObject(returnValue) ? createRevocableProxy(returnValue, revokeFns) : returnValue;
    },
  });
  revokeFns.push(revoke);
  return proxy;
}

function isObject(value: unknown): value is object {
  // TODO: are there any edge cases to consider here?
  return (typeof value === "object" && value !== null) || typeof value === "function";
}
