describe.each(membranes)("Membrane Equality -->  %s", (_, createMembrane: CreateMembraneFunction) => {
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
  });
});
