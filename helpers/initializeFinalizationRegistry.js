import { updateRunStatus } from "./updateRunStatus.js";

/**
 * Creates a new finalization registry that will update the UI for a given run when tracked objects are cleaned up.
 * @returns {IframeFinalizationRegistry}
 */
export function initializeFinalizationRegistry() {
  return new FinalizationRegistry(({ runNumber, kind }) => {
    try {
      updateRunStatus(runNumber, kind === "iframe" ? "GCd" : undefined, kind === "iframe-window" ? "GCd" : undefined);
      console.log(`Cleaned up ${kind} ${runNumber}.`);
    } catch (e) {
      console.error("finalizationRegistry error handler error:", e);
    }
  });
}
