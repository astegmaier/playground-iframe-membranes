const transpilerWorker = new Worker("/helpers/transpiler-worker.js");
transpilerWorker.addEventListener("message", (e) => {
  // TODO: make the promise there from the beginning.
  // TODO: refactor with async functions?
  transpiledScripts[e.data.scriptUrl] = new Promise(async (resolve) => {
    const module = await import("data:text/javascript;base64," + btoa(e.data.transpiledCode));
    resolve(module);
  });
});

/** @type {{[scriptUrl: string]: Promise<string> }} */
const transpiledScripts = {};

/**
 * Returns an object containing promises for transpiled code for each scriptUrl.
 * @param {string[]} scriptPaths Paths to the typescript files of the modules you want to import.
 * @returns {{[scriptUrl: string]: Promise<any> }} An object promises that resolve to each imported transpiled modules.
 */
export function getTranspiledModules(scriptPaths) {
  scriptPaths.forEach((url) => transpilerWorker.postMessage(url));
  return transpiledScripts;
}
