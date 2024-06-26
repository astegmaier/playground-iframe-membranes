export function createMembrane<T extends object>(target: T) {
  const revokeFnsCache = new RevokeFnsCache<T>();
  const proxyIdentityCache = new ProxyIdentityCache<T>();
  const proxy = createRevocableProxy(target, revokeFnsCache, proxyIdentityCache);
  return {
    membrane: proxy,
    revoke: () => {
      revokeFnsCache.revokeAll();
    },
  };
}

function createRevocableProxy<T extends object>(
  target: T,
  revokeFnsCache: RevokeFnsCache<T>,
  proxyIdentityCache: ProxyIdentityCache<T>
): T {
  function wrapper(target: any, direction: Direction): any {
    // return target if it's a primitive value
    if (isPrimitive(target)) return target;
    // Return the proxy if it already exists.
    if (proxyIdentityCache.get(target, direction)) return proxyIdentityCache.get(target, direction);
    const flippedDirection = proxyIdentityCache.flipDirection(direction);
    function handleErrors(handler: (...args: any[]) => any) {
      return (...args: any[]) => {
        try {
          return handler(...args);
        } catch (e: any) {
          throw wrapper(e, direction);
        }
      };
    }
    const { proxy, revoke } = Proxy.revocable(target, {
      apply(target, thisArg, argArray) {
        return handleErrors(() =>
          wrapper(
            Reflect.apply(
              target,
              wrapper(thisArg, flippedDirection),
              argArray.map((arg) => wrapper(arg, flippedDirection))
            ),
            direction
          )
        )();
      },
      construct(target, argArray, newTarget) {
        return handleErrors(() =>
          wrapper(
            Reflect.construct(
              target,
              argArray.map((arg) => wrapper(arg, flippedDirection)),
              wrapper(newTarget, flippedDirection)
            ),
            direction
          )
        )();
      },
      defineProperty(target, property, attributes) {
        return handleErrors(() => Reflect.defineProperty(target, property, wrapper(attributes, flippedDirection)))();
      },
      deleteProperty(target, p) {
        return handleErrors(() => Reflect.deleteProperty(target, p))();
      },
      get(target, p, receiver) {
        const propertyDescriptor = Reflect.getOwnPropertyDescriptor(target, p);
        if (propertyDescriptor && propertyDescriptor.writable === false && propertyDescriptor.configurable === false) {
          // Proxy must return the original value for non-writable, non-configurable properties
          // https://262.ecma-international.org/8.0/#sec-proxy-object-internal-methods-and-internal-slots-get-p-receiver
          console.warn(
            "Warning: Membrane isolation broken. Returning original value for non-writable, non-configurable property ",
            p
          );
          // This used to be Reflect.get(target, p, receiver), but that caused errors in some cases.
          // For example, in the browser, calling `Reflect.get(unproxiedWindowObject, "window", windowProxy)`
          // would produce an error: `TypeError: Illegal invocation at Reflect.get`
          // I think omitting the receiver is the correct behavior, since we're breaking the proxy here anyways.
          return Reflect.get(target, p);
        }
        return handleErrors(() => wrapper(Reflect.get(target, p, wrapper(receiver, flippedDirection)), direction))();
      },
      getOwnPropertyDescriptor(target, p) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, p);
        // If the property on the (non-proxied) target is not configurable, we _must_ return the real property descriptor, or we'll throw the error:
        // "TypeError: 'getOwnPropertyDescriptor' on proxy: trap returned descriptor for property 'foo' that is incompatible with the existing property in the proxy target"
        if (descriptor && !descriptor.configurable) {
          // TODO: I think this might break the membrane isolation, especially if the 'value', 'get', or 'set' properties of the descriptor are meaty things. We should try to figure out how to address this.
          console.warn(
            "Warning: Membrane isolation because getOwnPropertyDescriptor() was called on a non-configurable property",
            p
          );
          return descriptor;
        }
        return handleErrors(() => wrapper(descriptor, direction))();
      },
      getPrototypeOf(target) {
        return handleErrors(() => wrapper(Reflect.getPrototypeOf(target), direction))();
      },
      has(target, p) {
        return handleErrors(() => Reflect.has(target, p))();
      },
      isExtensible(target) {
        return handleErrors(() => Reflect.isExtensible(target))();
      },
      ownKeys(target) {
        return handleErrors(() => Reflect.ownKeys(target))();
      },
      preventExtensions(target) {
        return handleErrors(() => Reflect.preventExtensions(target))();
      },
      set(target, p, newValue, receiver) {
        return handleErrors(() =>
          Reflect.set(target, p, wrapper(newValue, flippedDirection), wrapper(receiver, flippedDirection))
        )();
      },
      setPrototypeOf(target, v) {
        return handleErrors(() => Reflect.setPrototypeOf(target, wrapper(v, flippedDirection)))();
      },
    });
    proxyIdentityCache.add(target, proxy, direction);
    revokeFnsCache.add(proxy, revoke);
    return proxy;
  }

  return wrapper(target, "dry");
}

function isPrimitive(value: any): boolean {
  return Object(value) !== value; // TODO: will this work if "Object" comes from the main window realm? Another way to do this would be to check for "null" and "typeof" !== "object" | "function". It's not clear which one is better.
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
class RevokeFnsCache<T extends object> {
  private proxyToRevokeFn = new WeakMap<T, () => void>();
  private revokeFnWeakRefs: WeakRef<() => void | undefined>[] = [];
  add(proxy: T, revokeFn: () => void) {
    this.proxyToRevokeFn.set(proxy, revokeFn);
    this.revokeFnWeakRefs.push(new WeakRef(revokeFn));
  }
  revokeAll() {
    this.revokeFnWeakRefs.forEach((revokeFnWeakRef) => revokeFnWeakRef.deref()?.());
  }
}

// Direction object is moving from
type Direction = "dry" | "wet";

class ProxyIdentityCache<T extends object> {
  dryMap: WeakMap<T, WeakRef<T>>;
  wetMap: WeakMap<T, WeakRef<T>>;
  constructor() {
    this.dryMap = new WeakMap();
    this.wetMap = new WeakMap();
  }
  get(target: T, direction: Direction) {
    return this.getMapForDirection(direction)?.get(target)?.deref();
  }
  add(target: T, wrapper: T, direction: Direction) {
    this.getMapForDirection(direction)?.set(target, new WeakRef<T>(wrapper));
    this.getMapForDirection(this.flipDirection(direction))?.set(wrapper, new WeakRef(target));
  }
  flipDirection(direction: Direction): Direction {
    return direction === "dry" ? "wet" : "dry";
  }
  private getMapForDirection(direction: Direction) {
    return direction === "dry" ? this.dryMap : this.wetMap;
  }
}
