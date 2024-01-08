This scenario illustrates what happens when an object created inside the iframe realm is intentionally leaked in the main window.

When you run it, you'll see that the iframe's `contentWindow` will leak, but the `HTMLIFrameElement` will not.
