const transpilerWorker = new Worker("helpers/transpiler-worker.js");
transpilerWorker.addEventListener("message", async (e) => {
  const { scriptUrl, transpiledCode, error } = e.data;
  if (error) {
    resolveAndRejectFns[scriptUrl]?.reject(error);
  } else {
    const module = await import("data:text/javascript;base64," + btoa(transpiledCode));
    resolveAndRejectFns[scriptUrl]?.resolve(module);
  }
});

/** @type {{[scriptUrl: string]: Promise<string> }} */
const transpiledModulePromises = {};

/** @type {{[scriptUrl: string]: {resolve: (result: any) => void, reject: (reason: any) => void}}} */
const resolveAndRejectFns = {};

/**
 * Returns an object containing promises for transpiled code for each scriptUrl in the array.
 * @param {string[]} scriptPaths Paths to the typescript files of the modules you want to import.
 * @returns {{[scriptUrl: string]: Promise<any> }} An object promises that resolve to each imported transpiled modules.
 */
export function getTranspiledModules(scriptPaths) {
  scriptPaths.forEach((url) => {
    if (!transpiledModulePromises[url]) {
      transpiledModulePromises[url] = new Promise((resolve, reject) => {
        resolveAndRejectFns[url] = { resolve, reject };
      });
      transpilerWorker.postMessage(url);
    }
  });
  return transpiledModulePromises;
}
