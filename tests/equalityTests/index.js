// @ts-nocheck
export function runTests(createMembrane) {
  try {
    testMembraneEquality(createMembrane);
  } catch (e) {
    console.error(e);
    alert(e);
  }
}
function testMembraneEquality(createMembrane) {
  let bazSpy;
  const originalObject = {
    foo: "bar",
    nested: { a: 1 },
    collection: [{ x: 1 }, { x: 2 }, { x: 3 }],
    setBaz: function (baz) {
      this.baz = baz;
      bazSpy = baz;
    },
  };
  const { target, revoke } = createMembrane(originalObject);
  // primitives are unchanged
  assertEquals(originalObject.foo, target.foo);
  // objects are proxied
  assertDifferent(originalObject.nested, target.nested);
  // arrays are proxied
  assertDifferent(originalObject.collection, target.collection);
  // multiple accesses return the same proxy
  assertSame(target.nested, target.nested);
  assertSame(target.collection, target.collection);
  assertSame(target.collection[0], target.collection[0]);
  // functions are proxied
  assertDifferent(originalObject.setBaz, target.setBaz);
  // function arguments are proxied within the membrane, but returned unwrapped
  const originalBaz = { a: 1 };
  target.setBaz(originalBaz);
  assertEquals(originalBaz, target.baz);
  assertDifferent(bazSpy, target.baz);
}
function assertThrows(f, ErrorType) {
  try {
    f();
  } catch (e) {
    if (e instanceof ErrorType) return;
    throw e;
  }
  throw new Error("Expected exception");
}
function assertEquals(expected, actual) {
  if (expected != actual) throw new Error("Expected " + expected + ", got " + actual);
}
function assertSame(expected, actual) {
  if (expected !== actual) throw new Error("Expected " + expected + ", got " + actual);
}
function assertDifferent(expected, actual) {
  if (expected === actual) throw new Error("Expected " + expected + ", got " + actual);
}
