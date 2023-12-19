# Iframe Proxies Playground</h1>

This project is a proof-of-concept of an idea about how to isolate sourceless/same-domain iframes with [revokable proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable).

Compared with isolated/cross-domain iframes, sourceless iframes offer the ability to synchronously communicate with the main page with objects and functions. This power comes at the cost of increased chances for memory leaks because it enables inside-of-iframe code to become entangled with code outside the iframe.

In this project, we are attempting to solve this problem by intercepting communication between iframe code and main window code with proxies. This enables us to cleanly break all retainers between the iframe and the main window when it is removed, which reduces the chances of a memory leak.

For more details [see it running live](https://astegmaier.github.io/playground-iframe-proxies/).

## Running Locally

1. Clone this repo by running `git clone https://github.com/astegmaier/playground-iframe-proxies.git`
2. Change into the directory by running `cd playground-iframe-proxies`
3. Ensure [nodejs](https://nodejs.org/en/) is installed.
4. Run `npx http-server` to start a local server. You can also install `http-server` globally by running `npm install -g http-server` and then running `http-server` directly.
5. Open `http://localhost:8080/` in your browser.
