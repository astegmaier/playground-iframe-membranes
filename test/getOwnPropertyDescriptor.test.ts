describe.each(membranes)("Membrane Equality -->  %s", (_, createMembrane: CreateMembraneFunction) => {
  describe("getOwnPropertyDescriptor", () => {
    it("basic descriptors", () => {
      const wetObj: { foo?: number } = {};
      const initialDescriptor: PropertyDescriptor = {
        value: 42,
        configurable: false,
        enumerable: false,
        writable: false,
      };
      Object.defineProperty(wetObj, "foo", initialDescriptor);
      const { membrane: dryMembrane } = createMembrane(wetObj);
      const retrievedDescriptor = Object.getOwnPropertyDescriptor(dryMembrane, "foo");
      expect(retrievedDescriptor).toEqual(initialDescriptor);
    });

    it("descriptors with a getter and 'configurable: false'", () => {
      const wetObj: { foo?: number } = {};
      Object.defineProperty(wetObj, "foo", {
        get() {
          return 42;
        },
        configurable: false, // <-- this is the important part of the test that requires special logic for our getOwnPropertyDescriptor() to always return the exact same descriptor object as the proxy target.
      });
      const { membrane: dryMembrane } = createMembrane(wetObj);

      const descriptor = Object.getOwnPropertyDescriptor(dryMembrane, "foo");
      expect(typeof descriptor.get).toBe("function");
      expect(descriptor.set).toBeUndefined();
      expect(descriptor.configurable).toBe(false);
      expect(descriptor.enumerable).toBe(false);
    });

    it("descriptors with a getter and setter and 'configurable: false'", () => {
      const wetObj: { foo?: number } = {};
      Object.defineProperty(wetObj, "foo", {
        get() {
          return 42;
        },
        set() {
          // do nothing
        },
        configurable: false, // <-- this is the important part of the test that requires special logic for our getOwnPropertyDescriptor() to always return the exact same descriptor object as the proxy target.
      });
      const { membrane: dryMembrane } = createMembrane(wetObj);

      const descriptor = Object.getOwnPropertyDescriptor(dryMembrane, "foo");
      expect(typeof descriptor.get).toBe("function");
      expect(typeof descriptor.set).toBe("function");
      expect(descriptor.configurable).toBe(false);
      expect(descriptor.enumerable).toBe(false);
    });
  });
});
