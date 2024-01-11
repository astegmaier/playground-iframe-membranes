This example membrane was written by Tom Van Cutsem and published [in the examples folder of the harmony-reflect library source code](https://github.com/tvcutsem/harmony-reflect/blob/master/examples/membrane.js), slightly adapted to run in this playground.

It illustrates a very comprehensive implementation. However, since it was written before the existence of Proxy.revocable, revoking the membrane has no effect on garbage collection.
