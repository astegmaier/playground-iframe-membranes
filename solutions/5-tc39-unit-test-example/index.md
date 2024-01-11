This example membrane was is taken from [the tc39 unit test suite](https://github.com/tc39/test262/blob/main/implementation-contributed/v8/mjsunit/es6/proxies-example-membrane.js), slightly adapted to run in this playground.

Compared with the example written by Van Cutsem (Solution 3), it is much simpler. However, it may not correctly handle cases like frozen/sealed/non-extensible objects. Like Van Cutsem's example, it also was written before the existence of `Proxy.revocable`, so revoking the membrane has no effect on garbage collection.
