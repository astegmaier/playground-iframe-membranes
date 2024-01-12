# Iframe Membranes Playground</h1>

This project is a proof-of-concept of an idea about how to isolate sourceless/same-domain iframes by using [revocable proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable)</a> to build a [membrane](https://tvcutsem.github.io/js-membranes) around the iframe realm.

Compared with isolated/cross-domain iframes, sourceless iframes offer the ability to synchronously communicate with the main page with objects and functions. This power comes at the cost of increased chances for memory leaks because it enables inside-of-iframe code to become entangled with code outside the iframe.

In this project, we are attempting to solve this problem by building a "membrane" that intercepts communication between iframe code and main window code with proxies. When objects from the iframe pass over the membrane, they are replaced with a revocable proxy. This enables us to cleanly break all retainers between the iframe and the main window when it is removed, which should (if implemented comprehensively) completely eliminate the chance of iframe realm memory leaks.

For more details [see it running live](https://astegmaier.github.io/playground-iframe-membranes/).

## Running Locally

1. Clone this repo by running `git clone https://github.com/astegmaier/playground-iframe-membranes.git`
2. Change into the directory by running `cd playground-iframe-membranes`
3. Ensure [nodejs](https://nodejs.org/en/) and [yarn classic](https://classic.yarnpkg.com/en/docs) is installed.
4. Install dependencies by running `yarn`.
5. Run `yarn start`.
6. Open `http://localhost:8080/` in your browser.
