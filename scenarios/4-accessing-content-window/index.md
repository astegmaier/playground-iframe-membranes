This scenario tests what happens when we apply the proxy to an iframe object and try to access contentWindow.window recursively.

Earlier versions of the membrane would blow up because our interceptor would call `Reflect.get(unproxiedWindow, "window", windowProxy)`, which would produce an error: `TypeError: Illegal invocation at Reflect.get`

This test cannot be run in Jest, because the `window` objects in `jsdom` have different property descriptors than a real one.