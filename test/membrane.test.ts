import { createMembrane as baseline } from "../solutions/1-baseline/index";
import { createMembrane as withRevoke } from "../solutions/2-store-revoke-in-weakrefs/index";
import { createMembrane as harmonyExample } from "../solutions/3-harmony-reflect-example/index";
import { createMembrane as tc39Example } from "../solutions/5-tc39-unit-test-example/index";
import { createMembrane as esMembraneExample } from "../solutions/7-es-membrane-example/index";
import { MembraneMocks } from "./es-membrane-node-mocks";

describe.each([
  ["baseline", baseline],
  ["with revoke", withRevoke],
  ["harmony-reflect example", harmonyExample],
  ["tc39 unit test example", tc39Example],
  ["es-membrane example", esMembraneExample],
])("Membrane %s", (_, createMembrane: CreateMembraneFunction) => {
  describe("nested equality", () => {
    let bazSpy: any;
    const wetObject = {
      baz: { foo: "bar" },
      foo: "bar",
      nested: { a: 1 },
      collection: [{ x: 1 }, { x: 2 }, { x: 3 }],
      functionThatModifies: function (baz: any) {
        this.baz = baz;
        bazSpy = baz;
      },
      _private: "private",
      get private() {
        return this._private;
      },
      set private(value) {
        this._private = value;
      },
    };
    const { membrane: dryMembrane } = createMembrane(wetObject);
    test("primitives are unchanged", () => {
      expect(dryMembrane.foo).toBe(wetObject.foo);
    });
    test("objects are proxied", () => {
      expect(dryMembrane.nested).not.toBe(wetObject.nested);
    });
    test("arrays are proxied", () => {
      expect(dryMembrane.collection).not.toBe(wetObject.collection);
    });
    test("functions are proxied", () => {
      expect(dryMembrane.functionThatModifies).not.toBe(wetObject.functionThatModifies);
    });
    test("multiple accesses return the same proxy", () => {
      expect(dryMembrane.nested).toBe(dryMembrane.nested);
      expect(dryMembrane.collection).toBe(dryMembrane.collection);
      expect(dryMembrane.collection[0]).toBe(dryMembrane.collection[0]);
    });

    // function arguments are proxied within the membrane, but returned unwrapped
    test("function arguments are proxied within the membrane, but returned unwrapped", () => {
      const originalBaz = { a: 1 };
      dryMembrane.functionThatModifies(originalBaz);
      expect(bazSpy).not.toBe(originalBaz);
      expect(bazSpy).toBe(wetObject.baz);
      expect(dryMembrane.baz).toBe(originalBaz);
      expect(wetObject.baz).not.toBe(originalBaz);
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Membrane tests, adapted from harmony-reflect library.                                                                  //
    // See: https://github.com/tc39/test262/blob/main/implementation-contributed/v8/mjsunit/es6/proxies-example-membrane.js   //
    // These tests are open-source under the Apache license, which lets us use them as long as we include proper attribution. //
    // See: https://docs.opensource.microsoft.com/legal/resources/oss-licenses-by-type/                                       //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Copyright (C) 2013 Software Languages Lab, Vrije Universiteit Brussel
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    // http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.

    describe("harmony-reflect tests", () => {
      test("primitives make it through unwrapped", () => {
        // membrane works for configurable properties
        const wetA = { x: 1 };
        const wetB = { y: wetA };
        const { membrane: dryB, revoke } = createMembrane(wetB);
        const dryA = dryB.y;
        expect(wetA).not.toBe(dryA);
        expect(wetB).not.toBe(dryB);
        expect(wetA.x).toBe(1);
        expect(dryA.x).toBe(1);
        revoke();
        expect(wetA.x).toBe(1);
        expect(wetB.y).toBe(wetA);
        expect(() => dryA.x).toThrow();
        expect(() => dryB.y).toThrow();
      });

      test("functions are wrapped", () => {
        const wetA = (x: unknown) => x;
        const { membrane: dryA, revoke } = createMembrane(wetA);

        expect(wetA).not.toBe(dryA);
        expect(wetA(1)).toBe(1);
        expect(dryA(1)).toBe(1);

        revoke();
        expect(wetA(1)).toBe(1);
        expect(() => dryA(1)).toThrow();
      });

      test("values returned from wrapped methods are wrapped", () => {
        const wetA = { x: 42 };
        const wetB = {
          m: function () {
            return wetA;
          },
        };
        const { membrane: dryB, revoke } = createMembrane(wetB);
        expect(wetA.x).toBe(42);
        expect(wetB.m().x).toBe(42);

        const dryA = dryB.m();

        expect(wetA).not.toBe(dryA);
        expect(wetB).not.toBe(dryB);

        expect(dryA.x).toBe(42);

        revoke();

        expect(() => dryA.x).toThrow();
        expect(() => dryB.m()).toThrow();
      });

      test("the prototype is also wrapped", () => {
        const wetA = { x: 42 };
        const wetB = Object.create(wetA);

        expect(Object.getPrototypeOf(wetB)).toBe(wetA);

        const { membrane: dryB, revoke } = createMembrane(wetB);
        const dryA = Object.getPrototypeOf(dryB);

        expect(wetA).not.toBe(dryA);
        expect(wetB).not.toBe(dryB);

        expect(dryA.x).toBe(42);
        revoke();
        expect(() => dryA.x).toThrow();
      });

      test("typeof results are unchanged when crossing a membrane", () => {
        // TODO: without the 'any' cast, I was getting "Object literal's property 'nul' implicitly has an 'any' type" (and a similar error for 'udf').
        const wetA: any = {
          obj: {},
          arr: [],
          fun: function () {},
          nbr: 1,
          str: "x",
          nul: null,
          udf: undefined,
          bln: true,
          rex: /x/,
          dat: new Date(),
        };
        const { membrane: dryA } = createMembrane(wetA);

        Object.keys(wetA).forEach(function (name) {
          expect(typeof wetA[name]).toBe(typeof dryA[name]);
        });
      });

      test("observation of non-configurability of wrapped properties", () => {
        const wetA = Object.create(null, {
          x: { value: 1, writable: true, enumerable: true, configurable: false },
        });

        expect(wetA.x).toBe(1);
        expect(Object.getOwnPropertyDescriptor(wetA, "x").configurable).toBe(false);

        const { membrane: dryA } = createMembrane(wetA);

        // perhaps surprisingly, just reading out the property value works,
        // since no code has yet observed that 'x' is a non-configurable
        // own property.
        expect(dryA.x).toBe(1);

        // membranes should expose a non-configurable prop as non-configurable
        const exactDesc = Object.getOwnPropertyDescriptor(dryA, "x");
        expect(exactDesc.configurable).toBe(false);
        expect(exactDesc.value).toBe(1);
        expect(exactDesc.enumerable).toBe(true);
        expect(exactDesc.writable).toBe(true);

        expect(dryA.x).toBe(1);
      });

      test("non-extensibility across a membrane", () => {
        const wetA = Object.preventExtensions({ x: 1 });
        expect(Object.isExtensible(wetA)).toBe(false);

        const { membrane: dryA } = createMembrane(wetA);

        expect(dryA.x).toBe(1);

        expect(Object.isExtensible(dryA)).toBe(false);

        const dryDesc = Object.getOwnPropertyDescriptor(dryA, "x");
        expect(dryDesc.value).toBe(1);

        // TODO: the original test had this line, but "Reflect.hasOwn" didn't seem to have made it into the ECMA standard.
        // expect(Reflect.hasOwn(dryA, "x")).toBe(true);
        // We're checking both of these instead. Hopefully they're equivalent - need to investigate.
        expect(Reflect.has(dryA, "x")).toBe(true);
        expect(Object.hasOwn(dryA, "x")).toBe(true);
      });

      test("assignment to a membrane", () => {
        const wetA = { x: 1 };
        expect(wetA.x).toBe(1);

        const { membrane, revoke } = createMembrane(wetA);
        const dryA: { x: number; y?: number } = membrane;

        Object.defineProperty(dryA, "y", { value: 2, writable: true, enumerable: true, configurable: true });
        expect(dryA.y).toBe(2);

        expect(dryA.x).toBe(1);
        dryA.x = 2;
        expect(dryA.x).toBe(2);

        revoke();

        expect(() => (dryA.x = 3)).toThrow();
      });

      test("definition of a new non-configurable property on a membrane", () => {
        const wetA: { x?: number } = {};
        const { membrane: dryA } = createMembrane(wetA);

        // membranes should allow definition of non-configurable props
        Object.defineProperty(dryA, "x", { value: 1, writable: true, enumerable: true, configurable: false });
        expect(dryA.x).toBe(1);
        expect(wetA.x).toBe(1);
      });

      test("a membrane preserves object identity", () => {
        const wetA = {};
        const wetB = { x: wetA };
        const { membrane: dryB } = createMembrane(wetB);

        const dryA1 = dryB.x;
        const dryA2 = dryB.x;
        expect(dryA1).toBe(dryA2);
      });

      test("a membrane properly unwraps a value when crossing the boundary wet->dry and then dry->wet, instead of doubly wrapping the value", () => {
        const wetA = {
          out: {},
          id: function (x: unknown) {
            return x;
          },
        } as const;

        const { membrane: dryA } = createMembrane(wetA);
        const dryB = dryA.out;
        const dryC = {};

        const outWetB = dryA.id(dryB);
        expect(dryB).toBe(outWetB);

        const outWetA = dryA.id(dryA);
        expect(dryA).toBe(outWetA);

        const outC = dryA.id(dryC);
        expect(outC).toBe(dryC);
      });

      test("a membrane handles Date objects", () => {
        const wetDate = new Date();
        const { membrane: dryDate } = createMembrane(wetDate);
        expect(typeof dryDate.getTime()).toBe("number");
      });

      test("a membrane handles has and delete operations", () => {
        const wetA = { x: 0 };
        const { membrane: dryA } = createMembrane(wetA);

        expect("x" in dryA).toBe(true);
        // TODO: the original test had this line, but "Reflect.hasOwn" didn't seem to have made it into the ECMA standard.
        // expect(Reflect.hasOwn(dryA, "x")).toBe(true);
        // We're checking both of these instead. Hopefully they're equivalent - need to investigate.
        expect(Reflect.has(dryA, "x")).toBe(true);
        expect(Object.hasOwn(dryA, "x")).toBe(true);

        delete dryA.x;
        expect("x" in dryA).toBe(false);
        // TODO: the original test had this line, but "Reflect.hasOwn" didn't seem to have made it into the ECMA standard.
        // expect(Reflect.hasOwn(dryA, "x")).toBe(false);
        // We're checking both of these instead. Hopefully they're equivalent - need to investigate.
        expect(Reflect.has(dryA, "x")).toBe(false);
        expect(Object.hasOwn(dryA, "x")).toBe(false);
      });

      test("a membrane handles Object.keys", () => {
        const wetA = { x: 0, y: 0 };
        const { membrane: dryA } = createMembrane(wetA);

        const dryKeys = Object.keys(dryA);
        expect(dryKeys.length).toBe(2);
      });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Membrane tests, adapted from tc39's test262 library.                                                                      //
    // See: https://github.com/tc39/test262/blob/main/implementation-contributed/v8/mjsunit/es6/proxies-example-membrane.js      //
    // These tests appear to be available under some sort of custom license that requires attribution in "the materials provided //
    // with the distribution" <-- it's unclear whether we'd have to do this, since technically the tests are not distributed     //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    describe("tc39 unit tests", () => {
      test("mega test", () => {
        let receiver;
        let argument;
        // TODO: add more specific types here and avoid 'any' cast.
        const o: any = {
          a: 6,
          b: { bb: 8 },
          f: function (x: unknown) {
            receiver = this;
            argument = x;
            return x;
          },
          g: function (x: any) {
            receiver = this;
            argument = x;
            return x.a;
          },
          h: function (x: unknown) {
            receiver = this;
            argument = x;
            this.q = x;
          },
          s: function (x: unknown) {
            receiver = this;
            argument = x;
            this.x = { y: x };
            return this;
          },
        };
        o[2] = { c: 7 };
        const { membrane: w, revoke } = createMembrane(o);
        const f = w.f;
        // TODO: what's up with the multiple 'var x =' lines here?
        var x = f(66);
        var x = f({ a: 1 });
        var x = w.f({ a: 1 });
        var a = x.a;
        expect(6).toEqual(w.a);
        expect(8).toEqual(w.b.bb);
        expect(7).toEqual(w[2]["c"]);
        expect(undefined).toEqual(w.c);
        expect(1).toEqual(w.f(1));
        expect(o).toBe(receiver);
        expect(1).toEqual(w.f({ a: 1 }).a);
        expect(o).toBe(receiver);
        expect(2).toEqual(w.g({ a: 2 }));
        expect(o).toBe(receiver);
        expect(w).toBe(w.f(w));
        expect(o).toBe(receiver);
        expect(o).toBe(argument);
        expect(o).toBe(w.f(o));
        expect(o).toBe(receiver);
        // Note that argument !== o, since o isn't dry, so gets wrapped wet again.
        expect(3).toEqual((w.r = { a: 3 }).a);
        expect(3).toEqual(w.r.a);
        expect(3).toEqual(o.r.a);
        w.h(3);
        expect(3).toEqual(w.q);
        expect(3).toEqual(o.q);
        expect(4).toEqual(new w.h(4).q);
        expect(5).toEqual(w.s(5).x.y);
        expect(o).toBe(receiver);

        const wb = w.b;
        const wr = w.r;
        const wf = w.f;
        const wf3 = w.f(3);
        const wfx = w.f({ a: 6 });
        const wgx = w.g({ a: { aa: 7 } });
        const wh4 = new w.h(4);
        const ws5 = w.s(5);
        const ws5x = ws5.x;

        revoke();

        expect(3).toEqual(wf3);
        expect(() => w.a).toThrow(Error);
        expect(() => w.r).toThrow(Error);
        expect(() => (w.r = { a: 4 })).toThrow(Error);
        expect(() => o.r.a).toThrow(Error);
        expect(typeof o.r).toEqual("object");
        expect(5).toEqual((o.r = { a: 5 }).a);
        expect(5).toEqual(o.r.a);
        expect(() => w[1]).toThrow(Error);
        expect(() => w.c).toThrow(Error);
        expect(() => wb.bb).toThrow(Error);
        expect(3).toEqual(wr.a);
        expect(() => wf(4)).toThrow(Error);
        expect(6).toEqual(wfx.a);
        expect(7).toEqual(wgx.aa);
        expect(() => wh4.q).toThrow(Error);
        expect(() => ws5.x).toThrow(Error);
        expect(() => ws5x.y).toThrow(Error);
      });
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Membrane tests, adapted from the es-membrane library.                                                 //
    // See: https://github.com/ajvincent/es-membrane/blob/master/old-0.9/spec/concepts.js                    //
    // The license below appears to allow us to use it (if we want to), as long as we include the copyright. //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    // ISC License (ISC)

    // Copyright (c) 2016-2022, Alexander J. Vincent <ajvincent@gmail.com>

    // Permission to use, copy, modify, and/or distribute this software for any purpose
    // with or without fee is hereby granted, provided that the above copyright notice
    // and this permission notice appear in all copies.

    // THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    // REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
    // FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    // INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
    // OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
    // TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
    // THIS SOFTWARE.

    describe("es-membrane tests", () => {
      /** We want to adapt tests that were written for es-membrane to our more generic createMembrane function. */
      class MockEsMembrane {
        getMembraneValue() {
          // TODO: implement this.
          // We'll probably need to publicly expose the membrane's internals to do this. Is it worth it?
        }
        getMembraneProxy() {
          // TODO: implement this.
        }
      }
      describe("basic concepts", () => {
        let wetDocument: any, dryDocument: any, membrane: MockEsMembrane;

        beforeEach(function () {
          const parts = MembraneMocks();
          wetDocument = parts.wet.doc;

          // ansteg: This was originally "dryDocument = parts.dry.doc;"" We are modifying it to make it adaptable to our other implementations.
          const createMembraneResult = createMembrane(wetDocument);
          dryDocument = createMembraneResult.membrane;

          // ansteg: We emulate the way that es-membrane does revoking - through dispatching an 'unload' event.
          wetDocument.dispatchEvent = (eventName: string) => {
            if (eventName === "unload") {
              createMembraneResult.revoke();
            }
          };
          membrane = new MockEsMembrane();
        });

        afterEach(function () {
          wetDocument = null;
          dryDocument = null;
          membrane = null;
        });

        it("dryDocument and wetDocument should not be the same", function () {
          expect(dryDocument === wetDocument).toBe(false);
        });

        it("Looking up a primitive on a directly defined value works", function () {
          expect(dryDocument.nodeType).toBe(9);
        });

        it("Looking up null through a property name works", function () {
          expect(dryDocument.ownerDocument).toBe(null);
        });

        it("Looking up null through a property getter works", function () {
          expect(dryDocument.firstChild).toBe(null);
        });

        // TODO: In order to implement this, we'll need implement getMembraneValue and getMembraneProxy.
        // This requires exposing the membranes internal maps, which might be more trouble than its worth.
        // But maybe we could make it optional so membrane implementations that have these maps can opt-in to the test?

        // it("Setters should wrap and unwrap values correctly", function () {
        //   var extraHolder;
        //   const desc = {
        //     get: function () {
        //       return extraHolder;
        //     },
        //     set: function (val) {
        //       extraHolder = val;
        //       return val;
        //     },
        //     enumerable: true,
        //     configurable: true,
        //   };

        //   Reflect.defineProperty(dryDocument, "extra", desc);

        //   var unwrappedExtra = {};
        //   dryDocument.extra = unwrappedExtra;
        //   expect(typeof extraHolder).toBe("object");
        //   expect(extraHolder).not.toBe(null);
        //   expect(extraHolder).not.toBe(unwrappedExtra);

        //   /* In summary:
        //    *
        //    * dryDocument is a proxy, dryDocument.extra is an unwrapped object
        //    * wetDocument is an unwrapped object, wetDocument.extra is a proxy
        //    */

        //   let found, foundValue;
        //   [found, foundValue] = membrane.getMembraneValue("wet", wetDocument);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(wetDocument);

        //   [found, foundValue] = membrane.getMembraneValue("dry", dryDocument);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(wetDocument);

        //   [found, foundValue] = membrane.getMembraneProxy("wet", wetDocument);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(wetDocument);

        //   [found, foundValue] = membrane.getMembraneProxy("dry", dryDocument);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(dryDocument);

        //   [found, foundValue] = membrane.getMembraneValue("wet", wetDocument.extra);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(unwrappedExtra);

        //   [found, foundValue] = membrane.getMembraneValue("dry", dryDocument.extra);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(unwrappedExtra);

        //   [found, foundValue] = membrane.getMembraneProxy("wet", wetDocument.extra);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(extraHolder);

        //   [found, foundValue] = membrane.getMembraneProxy("dry", dryDocument.extra);
        //   expect(found).toBe(true);
        //   expect(foundValue).toBe(unwrappedExtra);
        // });

        // it("Looking up an object twice returns the same object", function () {
        //   var root1 = dryDocument.rootElement;
        //   var root2 = dryDocument.rootElement;
        //   expect(root1 === root2).toBe(true);
        //   expect(root1 !== wetDocument.rootElement).toBe(true);
        //   expect(typeof root1).toBe("object");
        //   expect(root1 !== null).toBe(true);
        // });

        // it("Looking up an cyclic object (a.b.c == a)", function () {
        //   var root = dryDocument.rootElement;
        //   var owner = root.ownerDocument;
        //   expect(dryDocument === owner).toBe(true);
        // });

        // it("Looking up a method twice returns the same method", function () {
        //   var method1 = dryDocument.insertBefore;
        //   var method2 = dryDocument.insertBefore;

        //   expect(method1 === method2).toBe(true);
        //   expect(method1 !== wetDocument.insertBefore).toBe(true);
        //   expect(typeof method1).toBe("function");
        // });

        // it("Looking up a non-configurable, non-writable property twice returns the same property, protected", function () {
        //   const obj = { value: 6 };
        //   Reflect.defineProperty(wetDocument, "extra", {
        //     value: obj,
        //     writable: false,
        //     enumerable: true,
        //     configurable: false,
        //   });

        //   var lookup1 = dryDocument.extra;
        //   var lookup2 = dryDocument.extra;

        //   expect(lookup1 === lookup2).toBe(true);
        //   expect(lookup1 === obj).toBe(false);

        //   expect(lookup1.value).toBe(6);
        // });

        // it("Looking up an accessor descriptor works", function () {
        //   var desc = Object.getOwnPropertyDescriptor(dryDocument, "firstChild");
        //   expect(desc.configurable).toBe(true);
        //   expect(desc.enumerable).toBe(true);
        //   expect(typeof desc.get).toBe("function");
        //   expect("set" in desc).toBe(true);
        //   expect(typeof desc.set).toBe("undefined");

        //   desc = Object.getOwnPropertyDescriptor(dryDocument, "baseURL");
        //   expect(desc.configurable).toBe(true);
        //   expect(desc.enumerable).toBe(true);
        //   expect(typeof desc.get).toBe("function");
        //   expect(typeof desc.set).toBe("function");

        //   dryDocument.baseURL = "https://www.ecmascript.org/";
        //   expect(dryDocument.baseURL).toBe("https://www.ecmascript.org/");
        // });

        // it("Executing a method returns a properly wrapped object", function () {
        //   var rv;
        //   expect(function () {
        //     rv = dryDocument.insertBefore(dryDocument.rootElement, null);
        //   }).not.toThrow();
        //   expect(rv == dryDocument.firstChild).toBe(true);
        //   expect(dryDocument.firstChild == dryDocument.rootElement).toBe(true);
        // });

        // it("ElementDry and NodeDry respect Object.getPrototypeOf", function () {
        //   let wetRoot, ElementWet, NodeWet;
        //   let dryRoot, ElementDry, NodeDry;

        //   let parts = MembraneMocks();
        //   wetRoot = parts.wet.doc.rootElement;
        //   ElementWet = parts.wet.Element;
        //   NodeWet = parts.wet.Node;

        //   let e, eP, proto, p2;

        //   e = new ElementWet({}, "test");
        //   eP = Object.getPrototypeOf(e);
        //   proto = ElementWet.prototype;
        //   expect(eP === proto).toBe(true);

        //   proto = Object.getPrototypeOf(proto);
        //   p2 = NodeWet.prototype;
        //   expect(proto === p2).toBe(true);

        //   dryRoot = parts.dry.doc.rootElement;
        //   ElementDry = parts.dry.Element;
        //   NodeDry = parts.dry.Node;

        //   e = new ElementDry({}, "test");
        //   eP = Object.getPrototypeOf(e);
        //   proto = ElementDry.prototype;
        //   expect(eP === proto).toBe(true);

        //   proto = Object.getPrototypeOf(proto);
        //   p2 = NodeDry.prototype;
        //   expect(proto === p2).toBe(true);

        //   expect(dryRoot instanceof ElementDry).toBe(true);

        //   expect(dryRoot instanceof NodeDry).toBe(true);
        // });

        // it("ElementDry as a constructor reflects assigned properties", function () {
        //   let parts = MembraneMocks();

        //   let ElementDry = parts.dry.Element;
        //   let ElementWet = parts.wet.Element;
        //   let proto1 = ElementDry.prototype;
        //   let owner = {
        //     isFakeDoc: true,
        //     root: null,
        //   };
        //   let k = new ElementDry(owner, "k");
        //   expect(typeof k).not.toBe("undefined");

        //   let proto2 = Object.getPrototypeOf(k);
        //   expect(proto1 === proto2).toBe(true);
        //   let kOwner = k.ownerDocument;
        //   expect(kOwner === owner).toBe(true);
        //   owner.root = k;

        //   /* This might be cheating, since on the "wet" object graph, there's no
        //    * reason to look up owner.root.  On the other hand, if k is passed back to
        //    * the "wet" object graph, being able to find the root property is allowed.
        //    */
        //   let dryWetMB = parts.membrane;

        //   let [found, wetK] = dryWetMB.getMembraneValue("wet", k);
        //   expect(found).toBe(true);

        //   expect(Object.getPrototypeOf(wetK) === ElementWet.prototype);
        //   let wetKOwner = wetK.ownerDocument;
        //   expect(wetKOwner !== owner).toBe(true);
        //   let wetKRoot = wetKOwner.root;
        //   expect(wetKRoot === wetK).toBe(true);
        // });

        // XXX ajvincent Be sure to retest this via frames, sandboxes.
        it("Executing a function via .apply() returns a properly wrapped object", function () {
          var method1 = dryDocument.insertBefore;
          var rv;
          expect(function () {
            rv = method1.apply(dryDocument, [dryDocument.rootElement, null]);
          }).not.toThrow();
          expect(rv == dryDocument.firstChild).toBe(true);
          expect(dryDocument.firstChild == dryDocument.rootElement).toBe(true);
        });

        it("Looking up a proxy-added property works", function () {
          [dryDocument, dryDocument.rootElement, dryDocument.insertBefore].forEach(function (dryObj) {
            var keys = Object.getOwnPropertyNames(dryObj);
            expect(keys.indexOf("membraneGraphName")).not.toBe(-1);
            expect(dryDocument.membraneGraphName).toBe("dry");
          });
        });

        it("Looking up Object.isExtensible() works", function () {
          let wetExtensible = Object.isExtensible(wetDocument);
          let dryExtensible = Object.isExtensible(dryDocument);

          expect(wetExtensible).toBe(true);
          expect(dryExtensible).toBe(true);

          Object.preventExtensions(wetDocument);

          wetExtensible = Object.isExtensible(wetDocument);
          dryExtensible = Object.isExtensible(dryDocument);

          expect(wetExtensible).toBe(false);
          expect(dryExtensible).toBe(false);
        });

        it("The in operator works", function () {
          let checkHas = function (value: any, valueName: any, propName: any, index: any, array: any) {
            expect(propName in value).toBe(index !== array.length - 1);
          };
          let propList = ["nodeType", "nodeName", "childNodes", "ownerDocument", "firstChild", "unknownProperty"];

          propList.forEach(checkHas.bind(null, dryDocument, "dryDocument"));

          // root follows inheritance patterns.
          let root = dryDocument.rootElement;
          propList.forEach(checkHas.bind(null, root, "root"));
        });

        describe("The delete operator works as expected", function () {
          it("on dryDocument.rootElement", function () {
            let wasDeleted = delete dryDocument.rootElement;
            expect(typeof dryDocument.rootElement).toBe("undefined");
            expect("rootElement" in dryDocument).toBe(false);
            expect(wasDeleted).toBe(true);
          });

          it("on dryDocument.rootElement.nodeName", function () {
            let root = dryDocument.rootElement;
            let wasDeleted = delete root.nodeName;
            expect(typeof root.nodeName).toBe("undefined");
            expect("nodeName" in root).toBe(false);
            expect(wasDeleted).toBe(true);
          });

          it("on dryDocument.rootElement.insertBefore", function () {
            let root = dryDocument.rootElement;
            let wasDeleted = delete root.insertBefore;

            // This is because insertBefore is inherited from NodeWet.prototype.
            expect(typeof root.insertBefore).toBe("function");
            expect("insertBefore" in root).toBe(true);
            expect(wasDeleted).toBe(true);
          });
        });

        describe("Deleting a property via Reflect.deleteProperty(...) works as expected", function () {
          it("when the property doesn't exist", function () {
            expect(Reflect.deleteProperty(dryDocument, "doesNotExist")).toBe(true);
          });

          it("when the property descriptor has configurable: true", function () {
            Reflect.defineProperty(dryDocument, "doesNotExist", {
              value: 2,
              writable: true,
              enumerable: true,
              configurable: true,
            });
            expect(Reflect.deleteProperty(dryDocument, "doesNotExist")).toBe(true);
            expect(Reflect.getOwnPropertyDescriptor(dryDocument, "doesNotExist")).toBe(undefined);
          });

          it("when the property descriptor has configurable: false", function () {
            Reflect.defineProperty(dryDocument, "doesNotExist", {
              value: 2,
              writable: true,
              enumerable: true,
              configurable: false,
            });
            expect(Reflect.deleteProperty(dryDocument, "doesNotExist")).toBe(false);
            let desc = Reflect.getOwnPropertyDescriptor(dryDocument, "doesNotExist");
            expect(typeof desc).toBe("object");
            if (desc) {
              expect(desc.value).toBe(2);
            }
          });

          it("when the property descriptor is initially defined on the original target with configurable: true", function () {
            Reflect.defineProperty(wetDocument, "doesNotExist", {
              value: 2,
              writable: true,
              enumerable: true,
              configurable: true,
            });
            expect(Reflect.deleteProperty(dryDocument, "doesNotExist")).toBe(true);
            expect(Reflect.getOwnPropertyDescriptor(dryDocument, "doesNotExist")).toBe(undefined);
          });

          it("when the property descriptor is initially defined on the original target with configurable: false", function () {
            Reflect.defineProperty(wetDocument, "doesNotExist", {
              value: 2,
              writable: true,
              enumerable: true,
              configurable: false,
            });
            expect(Reflect.deleteProperty(dryDocument, "doesNotExist")).toBe(false);
            let desc = Reflect.getOwnPropertyDescriptor(dryDocument, "doesNotExist");
            expect(typeof desc).toBe("object");
            if (desc) {
              expect(desc.value).toBe(2);
            }
          });
        });

        it("Defining a property via Object.defineProperty(...) works as expected", function () {
          Object.defineProperty(dryDocument, "screenWidth", {
            value: 200,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          expect(dryDocument.screenWidth).toBe(200);
          expect(wetDocument.screenWidth).toBe(200);

          let localHeight = 150;
          Object.defineProperty(dryDocument, "screenHeight", {
            get: function () {
              return localHeight;
            },
            set: function (val) {
              localHeight = val;
            },
            enumerable: true,
            configurable: true,
          });
          expect(dryDocument.screenHeight).toBe(150);
          expect(wetDocument.screenHeight).toBe(150);

          let location = {
            name: "location",
          };
          Object.defineProperty(dryDocument, "location", {
            value: location,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          expect(dryDocument.location === location).toBe(true);
          expect(typeof dryDocument.location.membraneGraphName).toBe("undefined");
          expect(wetDocument.location !== location).toBe(true);
          expect(wetDocument.location.name === "location").toBe(true);
          expect(wetDocument.location.membraneGraphName === "wet").toBe(true);

          /* XXX ajvincent There is an obvious temptation to just call:
           * dryDocument.screenWidth = 200;
           *
           * That's covered in the next test.  Here, we're testing defineProperty.
           *
           * On the other hand, we've just tested that setting a property from the
           * "dry" side retains its identity with the "dry" object graph.
           */

          // Additional test for configurable: false
          const obj = {};
          Object.defineProperty(dryDocument, "extra", {
            value: obj,
            writable: true,
            enumerable: false,
            configurable: false,
          });
          let extra = dryDocument.extra;
          expect(extra).toBe(obj);
        });

        it("Defining a property directly works as expected", function () {
          dryDocument.screenWidth = 200;
          expect(dryDocument.screenWidth).toBe(200);
          expect(wetDocument.screenWidth).toBe(200);

          let localHeight = 150;
          Object.defineProperty(dryDocument, "screenHeight", {
            get: function () {
              return localHeight;
            },
            set: function (val) {
              localHeight = val;
            },
            enumerable: true,
            configurable: true,
          });
          wetDocument.screenHeight = 200;
          expect(dryDocument.screenHeight).toBe(200);
          expect(wetDocument.screenHeight).toBe(200);

          let location = {
            name: "location",
          };
          dryDocument.location = location;
          expect(dryDocument.location === location).toBe(true);
          expect(typeof dryDocument.location.membraneGraphName).toBe("undefined");
          expect(wetDocument.location !== location).toBe(true);
          expect(wetDocument.location.name === "location").toBe(true);
          expect(wetDocument.location.membraneGraphName === "wet").toBe(true);
        });

        // it("Setting a prototype works as expected", function () {
        //   const logger = loggerLib.getLogger("test.membrane.setPrototypeOf");
        //   let wetRoot, ElementWet, NodeWet;
        //   let dryRoot, ElementDry, NodeDry;

        //   let parts = MembraneMocks(false, logger);
        //   wetRoot = parts.wet.doc.rootElement;
        //   ElementWet = parts.wet.Element;
        //   NodeWet = parts.wet.Node;
        //   parts.wet.root = wetRoot;

        //   dryRoot = parts.dry.doc.rootElement;
        //   ElementDry = parts.dry.Element;
        //   NodeDry = parts.dry.Node;
        //   parts.dry.root = dryRoot;

        //   let XHTMLElementDryProto = {
        //     namespaceURI: "http://www.w3.org/1999/xhtml",
        //   };
        //   let eProto = ElementDry.prototype;

        //   const traceMap = new Map(/* value: name */);
        //   {
        //     traceMap.addMember = function (value, name) {
        //       if (!this.has(value)) this.set(value, name);
        //       if (typeof value === "function" && !this.has(value.prototype))
        //         this.set(value.prototype, name + ".prototype");
        //     };

        //     {
        //       let keys = Reflect.ownKeys(parts.wet);
        //       keys.forEach(function (key) {
        //         let value = this[key];
        //         traceMap.addMember(value, "parts.wet." + key);
        //       }, parts.wet);

        //       traceMap.addMember(Reflect.getPrototypeOf(parts.wet.Node.prototype), "parts.wet.EventListener.prototype");
        //     }
        //     {
        //       let keys = Reflect.ownKeys(parts.dry);
        //       keys.forEach(function (key) {
        //         let value = this[key];
        //         traceMap.addMember(value, "parts.dry." + key);
        //       }, parts.dry);

        //       traceMap.addMember(Reflect.getPrototypeOf(parts.dry.Node.prototype), "parts.dry.EventListener.prototype");

        //       traceMap.set(XHTMLElementDryProto, "XHTMLElementDryProto");
        //     }

        //     traceMap.getPrototypeChain = function (value) {
        //       var rv = [],
        //         next;
        //       while (value) {
        //         next = this.get(value) || "(unknown)";
        //         rv.push(next);
        //         value = Reflect.getPrototypeOf(value);
        //       }
        //       return rv;
        //     };
        //   }

        //   {
        //     let chain = traceMap.getPrototypeChain(parts.wet.root);
        //     let expectedChain = [
        //       "parts.wet.root",
        //       "parts.wet.Element.prototype",
        //       "parts.wet.Node.prototype",
        //       "parts.wet.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }

        //   {
        //     let chain = traceMap.getPrototypeChain(parts.dry.root);
        //     let expectedChain = [
        //       "parts.dry.root",
        //       "parts.dry.Element.prototype",
        //       "parts.dry.Node.prototype",
        //       "parts.dry.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }

        //   expect(Reflect.setPrototypeOf(XHTMLElementDryProto, eProto)).toBe(true);
        //   {
        //     let chain = traceMap.getPrototypeChain(XHTMLElementDryProto);
        //     let expectedChain = [
        //       "XHTMLElementDryProto",
        //       "parts.dry.Element.prototype",
        //       "parts.dry.Node.prototype",
        //       "parts.dry.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }

        //   expect(Reflect.setPrototypeOf(dryRoot, XHTMLElementDryProto)).toBe(true);
        //   expect(Reflect.getPrototypeOf(dryRoot) === XHTMLElementDryProto).toBe(true);
        //   {
        //     let chain = traceMap.getPrototypeChain(parts.dry.root);
        //     let expectedChain = [
        //       "parts.dry.root",
        //       "XHTMLElementDryProto",
        //       "parts.dry.Element.prototype",
        //       "parts.dry.Node.prototype",
        //       "parts.dry.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }

        //   {
        //     let chain = traceMap.getPrototypeChain(parts.wet.root);
        //     let expectedChain = [
        //       "parts.wet.root",
        //       "(unknown)",
        //       "parts.wet.Element.prototype",
        //       "parts.wet.Node.prototype",
        //       "parts.wet.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }

        //   expect(dryRoot.namespaceURI).toBe(XHTMLElementDryProto.namespaceURI);
        //   expect(wetRoot.namespaceURI).toBe(XHTMLElementDryProto.namespaceURI);

        //   let XHTMLElementDry = function (ownerDoc, name) {
        //     // this takes care of ownerDoc, name
        //     ElementDry.apply(this, [ownerDoc, name]);
        //   };
        //   XHTMLElementDry.prototype = XHTMLElementDryProto;
        //   traceMap.addMember(XHTMLElementDry, "XHTMLElementDry");

        //   let x = new XHTMLElementDry(dryDocument, "test");
        //   traceMap.addMember(x, "x");
        //   {
        //     let chain = traceMap.getPrototypeChain(x);
        //     let expectedChain = [
        //       "x",
        //       "XHTMLElementDryProto",
        //       "parts.dry.Element.prototype",
        //       "parts.dry.Node.prototype",
        //       "parts.dry.EventListener.prototype",
        //       "(unknown)",
        //     ];
        //     expect(chain).toEqual(expectedChain);
        //   }
        //   expect(x.namespaceURI).toBe(XHTMLElementDryProto.namespaceURI);
        //   expect(x.nodeType).toBe(1);
        // });

        it("Calling Object.preventExtensions(...) works as expected", function () {
          expect(Object.isExtensible(dryDocument)).toBe(true);
          Object.preventExtensions(dryDocument);
          expect(Object.isExtensible(dryDocument)).toBe(false);

          // this line is NOT expected to throw an exception
          Object.preventExtensions(dryDocument);
          expect(Object.isExtensible(dryDocument)).toBe(false);
        });

        it("ObjectGraphHandler.prototype.revokeEverything() breaks all proxy access on an object graph", function () {
          function lookup(obj: any, propName: any) {
            return function () {
              return obj[propName];
            };
          }
          let root = lookup(dryDocument, "rootElement")();

          wetDocument.dispatchEvent("unload");
          expect(lookup(dryDocument, "nodeType")).toThrow();
          expect(lookup(dryDocument, "nodeName")).toThrow();
          expect(lookup(dryDocument, "childNodes")).toThrow();
          expect(lookup(dryDocument, "insertBefore")).toThrow();
          expect(lookup(dryDocument, "rootElement")).toThrow();
          expect(lookup(dryDocument, "parentNode")).toThrow();
          expect(lookup(dryDocument, "ownerDocument")).toThrow();
          expect(lookup(dryDocument, "membraneGraphName")).toThrow();

          expect(lookup(root, "nodeType")).toThrow();
          expect(lookup(root, "nodeName")).toThrow();
          expect(lookup(root, "childNodes")).toThrow();
          expect(lookup(root, "insertBefore")).toThrow();
          expect(lookup(root, "rootElement")).toThrow();
          expect(lookup(root, "parentNode")).toThrow();
          expect(lookup(root, "ownerDocument")).toThrow();
          expect(lookup(root, "membraneGraphName")).toThrow();
        });

        it("Wrapped descriptors throw if membrane revoked", function () {
          wetDocument.dispatchEvent("unload");
          expect(function () {
            dryDocument.baseURL = "https://www.ecmascript.org/";
          }).toThrow();

          function voidFunc(...args: unknown[]) {}
          expect(function () {
            let x = dryDocument.baseURL;
            voidFunc(x);
          }).toThrow();
        });

        describe("Object constructors should be properly wrapped (thanks to Luca Franceschini for this test)", function () {
          // objects returned by `should`
          function ObjectWrapper(obj: any) {
            // @ts-ignore - TODO: fix this
            this._obj = obj;
          }

          ObjectWrapper.prototype.equal = function equal(other: any) {
            return this._obj === other;
          };
          beforeEach(function () {
            Object.defineProperty(Object.prototype, "should", {
              configurable: true,
              get: function () {
                // @ts-ignore - TODO: fix this
                return new ObjectWrapper(this);
              },
            });
          });
          afterEach(function () {
            Reflect.deleteProperty(Object.prototype, "should");
          });
          it("for non-wrapped objects", function () {
            const rv = wetDocument.should.equal(wetDocument);
            expect(rv).toBe(true);
          });
          it("for wrapped objects", function () {
            const rv = dryDocument.should.equal(dryDocument);
            expect(rv).toBe(true);
          });
        });

        it("Array.prototype.splice works on wrapped arrays", function () {
          wetDocument.strings = ["alpha", "beta", "gamma"];
          expect(dryDocument.strings.length).toBe(3);

          Array.prototype.splice.apply(dryDocument.strings, [1, 1, "delta", "epsilon"]);

          expect(wetDocument.strings).toEqual(["alpha", "delta", "epsilon", "gamma"]);
        });
      });

      describe("Receivers in proxies", function () {
        let wetObj: any, dryObj: any;
        beforeEach(function () {
          wetObj = {
            ALPHA: {
              value: "A",
            },
            BETA: {
              value: "B",
            },

            alpha: {
              get upper() {
                return this._upper;
              },
              set upper(val) {
                this._upper = val;
              },
              _upper: null,
              value: "a",
            },

            beta: {
              _upper: null,
              value: "b",
            },

            X: {},
          };
          wetObj.alpha._upper = wetObj.ALPHA;
          wetObj.beta._upper = wetObj.BETA;

          // ansteg: this was originally:
          // let parts = MembraneMocks();
          // dryObj = parts.membrane.convertArgumentToProxy(parts.handlers.wet, parts.handlers.dry, wetObj);

          // We are modifying it to make it adaptable to our other implementations beyond es-membrane:
          dryObj = createMembrane(wetObj).membrane;
        });

        it("are where property lookups happen", function () {
          const a = dryObj.alpha,
            b = dryObj.beta,
            B = dryObj.BETA;
          const val = Reflect.get(a, "upper", b);
          expect(val).toBe(B);
        });

        it("are where property setter invocations happen", function () {
          const a = dryObj.alpha,
            b = dryObj.beta,
            A = dryObj.ALPHA,
            X = dryObj.X;
          const wetX = wetObj.X;
          Reflect.set(a, "upper", X, b);
          expect(b._upper).toBe(X);
          expect(a._upper).toBe(A);

          expect(wetObj.beta._upper).toBe(wetX);
        });
      });

      // it("More than one object graph can be available", function () {
      //   let parts = MembraneMocks(true);
      //   let wetDocument = parts.wet.doc;
      //   let dryDocument = parts.dry.doc;
      //   let dampDocument = parts[DAMP].doc;

      //   wetDocument.dispatchEvent("unload");

      //   expect(function () {
      //     void dryDocument.rootElement;
      //   }).toThrow();

      //   expect(function () {
      //     dampDocument.insertBefore(dampDocument.rootElement, null);
      //   }).not.toThrow();
      // });
    });
  });
});
