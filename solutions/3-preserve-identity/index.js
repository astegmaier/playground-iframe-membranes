export function createMembrane(target) {
  const revokeFnsCache = new RevokeFnsCache();
  const proxyIdentityCache = new ProxyIdentityCache();
  const proxy = createRevocableProxy(target, revokeFnsCache, proxyIdentityCache, "dry");
  return {
    target: proxy,
    revoke: () => {
      revokeFnsCache.revokeAll();
    },
  };
}

function createRevocableProxy(target, revokeFnsCache, proxyIdentityCache, direction) {
  function wrapper(target, direction) {
    // return target if it's a primitive value
    if (isPrimitive(target)) return target;
    // Return the proxy if it already exists.
    if (proxyIdentityCache.get(target, direction)) return proxyIdentityCache.get(target, direction);
    const flippedDirection = proxyIdentityCache.flipDirection(direction);
    // create the proxy recursively
    const { proxy, revoke } = Proxy.revocable(target, {
      get(target, name) {
        return wrapper(Reflect.get(target, name), direction);
      },
      apply(target, thisArg, argArray) {
        return wrapper(
          Reflect.apply(
            target,
            wrapper(thisArg, proxyIdentityCache, flippedDirection),
            argArray.map((arg) => wrapper(arg, flippedDirection))
          ),
          direction
        );
      },
    });
    proxyIdentityCache.add(target, proxy, direction);
    revokeFnsCache.add(proxy, revoke);
    return proxy;
  }

  return wrapper(target, "dry");
}

function isPrimitive(value) {
  // TODO: are there any edge cases to consider here?
  return (typeof value !== "object" && typeof value !== "function") || value === null;
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

class ProxyIdentityCache {
  constructor() {
    this.dryMap = new WeakMap();
    this.wetMap = new WeakMap();
  }
  get(target, direction) {
    return this[direction + "Map"]?.get(target);
  }
  add(target, wrapper, direction) {
    this[direction + "Map"]?.set(target, wrapper);
    this[this.flipDirection(direction) + "Map"]?.set(wrapper, target);
  }
  flipDirection(direction) {
    return direction === "dry" ? "wet" : "dry";
  }
}
