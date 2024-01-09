This scenario illustrates what happens when an object created inside the iframe realm is intentionally leaked in the main window.

When you run it without the proxy, you'll see that the iframe's `contentWindow` will leak, but the `HTMLIFrameElement` will not. The leaking contentWindow is the bigger problem, because it retains global objects captured within the iframe's realm (like `bigObject`).

When this sort of leak occurs, the heap snapshot will look like this:

![Heap Snapshot](./scenarios/1-leak-iframe-object/heap-snapshot.png);

Applying the proxy membrane to the iframe before running the scenario -- and then revoking it -- will solve the problem. 

