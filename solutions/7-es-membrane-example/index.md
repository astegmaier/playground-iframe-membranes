This example membrane was is taken from Alexander J. Vincent's [es-membrane repo](https://github.com/tc39/test262/blob/main/implementation-contributed/v8/mjsunit/es6/proxies-example-membrane.js), slightly adapted to run in this playground.

This solution is considerably more complex. One of the reasons is that Vincent had more ambitious goals than we do. Specifically, he was trying to enable multiple membranes to be used at the same time (and talk to each other) without creating duplicative proxies. For example, a slide from [his 2018 presentation to TC39](https://docs.google.com/presentation/d/1r0e_jPnGqPyT_q07p7jtHnD-dMV2ONN68Jc9FVze-XY/edit#slide=id.g3e0e1ea5fb_0_73) shows what he was trying to avoid in the multi-membrane scenario:

![Proxy-to-a-Proxy Scenario](./solutions/7-es-membrane-example/proxy-to-a-proxy.png);

In this situation, Bob's realm would loose access to the DOM object if Alice's realm got revoked. However, this might be acceptable in scenarios where membranes don't interact with each other very much, or get revoked independently. It is unclear to me at this point if there are other function or performance problems that would follow from this proxy-to-a-proxy structure.

Despite this complexity, there still might be some useful learnings here, because he seems to have investigated the nitty-gritty details of implementing membranes in JavaScript more than anyone else.