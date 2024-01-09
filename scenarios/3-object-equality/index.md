This scenario tests to make sure that we preserve object identity when objects pass through the proxy membrane.

By default `originalObject !== new Proxy(originalObject)`. This behavior could cause problems for code - like event listeners - that relies on object identity.

To solve it, we need to make sure that any given object from one side of the membrane is always represented by the _same_ proxy on the other side.