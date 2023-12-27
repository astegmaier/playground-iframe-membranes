import { updateRunStatus } from "./updateRunStatus.js";

export function initializeFinalizationRegistry() {
  // We have to store the finalizationRegistry as a global so it doesn't get GC'd unless we want it to.
  window.finalizationRegistry = new FinalizationRegistry((objectInfo) => {
    try {
      const { runNumber, kind } = JSON.parse(objectInfo);
      updateRunStatus(runNumber, kind === "iframe" ? "GCd" : undefined, kind === "iframe-window" ? "GCd" : undefined);
      console.log(`Cleaned up ${kind} ${runNumber}.`);
    } catch (e) {
      console.error("finalizationRegistry error handler error:", e);
    }
  });
}
