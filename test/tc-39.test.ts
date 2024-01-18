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

describe.each(membranes)("tc39 unit tests --> %s membrane", (_, createMembrane: CreateMembraneFunction) => {
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
