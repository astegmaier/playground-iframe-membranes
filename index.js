import { getTrackedIframe } from "./helpers/getTrackedIframe.js";
import { initializeFinalizationRegistry } from "./helpers/initializeFinalizationRegistry.js";
import { updateRunStatus } from "./helpers/updateRunStatus.js";
import { updateScenarioDescription } from "./helpers/updateScenarioDescription.js";

let runCount = 0;

const scenarioDropdown = document.getElementById("scenario");
scenarioDropdown.onchange = (e) => updateScenarioDescription(e.currentTarget.value);
updateScenarioDescription(scenarioDropdown.value);

initializeFinalizationRegistry();

document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./${scenarioDropdown.value}/index.js`);
  const iframe = await getTrackedIframe(`./${scenarioDropdown.value}/iframe.js`, ++runCount);
  await scenarioModule.runScenario(iframe);
};

document.getElementById("remove-iframes").onclick = () => {
  for (let i = 1; i <= runCount; i++) {
    const iframeContainer = document.getElementById(`iframe-container-${i}`);
    if (iframeContainer.hasChildNodes()) {
      iframeContainer.textContent = "";
      updateRunStatus(i, "Removed but not GCd", "Removed but not GCd");
    }
  }
  console.log("All iframes removed.");
};

document.getElementById("reset-scenario").onclick = () => {
  runCount = 0;
  document.getElementById("all-runs-container").textContent = "";
  initializeFinalizationRegistry();
  console.log("Scenario reset.");
};

document.getElementById("collect-garbage").onclick = async () => {
  if (window.gc) {
    await window.gc?.({ execution: "async" });
    console.log("Garbage collection finished.");
  } else {
    console.log("Unable to trigger garbage collection - please run with --expose-gc flag.");
  }
};
