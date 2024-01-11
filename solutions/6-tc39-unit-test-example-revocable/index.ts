// @ts-nocheck
// Copyright 2011 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// An identity-preserving membrane. Adapted from:
// http://wiki.ecmascript.org/doku.php?id=harmony:proxies#an_identity-preserving_membrane

export function createMembrane(target) {
  const wet2dry = 0;
  const dry2wet = 1;

  function flip(dir) {
    return (dir + 1) % 2;
  }

  let maps = [new WeakMap(), new WeakMap()];

  let revoked = false;
  const revokeFnCache = new RevokeFnCache();

  function wrap(dir, obj) {
    if (obj !== Object(obj)) return obj;

    let wrapper = maps[dir].get(obj);
    if (wrapper) return wrapper;

    let handler = new Proxy(
      {},
      {
        get: function (_, key) {
          if (revoked) throw new Error("revoked");
          switch (key) {
            case "apply":
              return (_, that, args) => {
                try {
                  return wrap(
                    dir,
                    Reflect.apply(
                      obj,
                      wrap(flip(dir), that),
                      args.map((x) => wrap(flip(dir), x))
                    )
                  );
                } catch (e) {
                  throw wrap(dir, e);
                }
              };
            case "construct":
              return (_, args, newt) => {
                try {
                  return wrap(
                    dir,
                    Reflect.construct(
                      obj,
                      args.map((x) => wrap(flip(dir), x)),
                      wrap(flip(dir), newt)
                    )
                  );
                } catch (e) {
                  throw wrap(dir, e);
                }
              };
            default:
              return (_, ...args) => {
                try {
                  return wrap(dir, Reflect[key](obj, ...args.map((x) => wrap(flip(dir), x))));
                } catch (e) {
                  throw wrap(dir, e);
                }
              };
          }
        },
      }
    );

    const { proxy, revoke } = Proxy.revocable(obj, handler);
    maps[dir].set(obj, proxy);
    maps[flip(dir)].set(proxy, obj);
    revokeFnCache.add(revoke, proxy);
    return proxy;
  }

  return Object.freeze({
    membrane: wrap(wet2dry, target),
    revoke: () => {
      revoked = true;
      revokeFnCache.revokeAll();
    },
  });
}

class RevokeFnCache {
  revokeFnWeakRefs = [];
  proxyToRevokeFn = new WeakMap();
  add(revokeFn, proxy) {
    this.proxyToRevokeFn.set(proxy, revokeFn);
    this.revokeFnWeakRefs.push(new WeakRef(revokeFn));
  }
  revokeAll() {
    for (const revokeFnWeakRef of this.revokeFnWeakRefs) {
      const revokeFn = revokeFnWeakRef.deref();
      if (revokeFn) {
        revokeFn();
      }
    }
    this.revokeFnWeakRefs = [];
  }
}
