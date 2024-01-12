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
  function wrapper(target: any, direction: Direction): T {
    // return target if it's a primitive value
    if (isPrimitive(target)) return target;
    // Return the proxy if it already exists.
    if (proxyIdentityCache.get(target, direction)) return proxyIdentityCache.get(target, direction);
    const flippedDirection = proxyIdentityCache.flipDirection(direction);

    // Create a proxy object that will forward all of the traps to a single function.
    const proxyHandler = new Proxy(
      {},
      {
        get(_, name: keyof ProxyHandler<T>) {
          // Create a function that will wrap errors thrown by handlers in the correct direction.
          function handleErrors(handler: (...args: any[]) => any) {
            return (...args: any[]) => {
              try {
                return handler(...args);
              } catch (e: any) {
                throw wrapper(direction, e);
              }
            };
          }
          switch (name) {
            case "get":
              return handleErrors((_handlerTarget: unknown, name: string) =>
                wrapper(Reflect.get(target, name), direction)
              );
            case "apply":
              return handleErrors((_handlerTarget: unknown, thisArg: any, argArray: any[]) =>
                wrapper(
                  Reflect.apply(
                    target,
                    wrapper(thisArg, flippedDirection),
                    argArray.map((arg) => wrapper(arg, flippedDirection))
                  ),
                  direction
                )
              );
            default:
              return handleErrors((_handlerTarget: unknown, ...args: any[]) => {
                return wrapper(
                  // Call signatures don't match, so we cast Reflect as Any, but name is a keyof ProxyHandler<T> so it will always be reflectable
                  (Reflect as any)[name](target, ...args.map((arg) => wrapper(arg, flippedDirection))),
                  direction
                );
              });
          }
        },
      }
    );
    const { proxy, revoke } = Proxy.revocable(target, proxyHandler);
    proxyIdentityCache.add(target, proxy, direction);
    revokeFnsCache.add(proxy, revoke);
    return proxy;
  }

  return wrapper(target, "wet");
}

function isPrimitive(value: any): boolean {
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
