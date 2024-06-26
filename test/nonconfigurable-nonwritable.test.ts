describe.each(membranes)("Membrane Equality -->  %s", (_, createMembrane: CreateMembraneFunction) => {
  describe("Objects with non-configurable and non-writable properties", () => {
    test("Access to a non-configurable, non-writable property breaks the membrane, but does not throw.", () => {
      const wetParent: { foo?: number } = {};
      const wetFoo = { thisIsFoo: true };
      Object.defineProperty(wetParent, "foo", {
        value: wetFoo,
        writable: false,
        configurable: false,
      });
      const { membrane: dryMembrane } = createMembrane(wetParent);
      expect(dryMembrane.foo).toBe(wetFoo);
    });

    test("Access to a non-configurable property with only a getter, but 'writable: undefined' does NOT break the membrane.", () => {
      const wetParent: { foo?: number } = {};
      const wetFoo = { thisIsFoo: true };
      Object.defineProperty(wetParent, "foo", {
        get() {
          return wetFoo;
        },
        configurable: false,
      });
      const { membrane: dryMembrane } = createMembrane(wetParent);
      expect(dryMembrane.foo).toBe(dryMembrane.foo);
      expect(dryMembrane.foo).not.toBe(wetFoo);
    });
  });
});
