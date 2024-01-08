import { getTrackedIframe } from "./helpers/getTrackedIframe.js";
import { initializeFinalizationRegistry } from "./helpers/initializeFinalizationRegistry.js";
import { updateRunStatus } from "./helpers/updateRunStatus.js";
import { updateScenarioDescription } from "./helpers/updateScenarioDescription.js";

//////////////////////
// Initialize State //
//////////////////////

let runCount = 0;
// We have to store the finalizationRegistry as a global so it doesn't get GC'd unless we want it to.
window.finalizationRegistry = initializeFinalizationRegistry();

// The scenarioDropdown is the "source of truth" for our app's state.
const scenarioDropdown = /** @type {HTMLSelectElement} */ (document.getElementById("scenario"));
const validScenarios = new Set(Array.from(scenarioDropdown.options).map((option) => option.value));

// Set the initial scenario from the url, if possible.
function tryGetScenarioFromQuery() {
  const scenarioId = new URLSearchParams(window.location.search).get("scenario");
  return validScenarios.has(scenarioId) ? scenarioId : scenarioDropdown.options[0].value;
}
scenarioDropdown.value = tryGetScenarioFromQuery();
updateScenarioDescription(scenarioDropdown.value);

// Changes to the dropdown should be reflected in the url and the app UI (and vice versa).
scenarioDropdown.addEventListener("change", (e) => {
  const scenarioId = /** @type {HTMLSelectElement} */ (e.currentTarget).value;
  const url = new URL(window.location.href);
  url.searchParams.set("scenario", scenarioId);
  history.pushState({}, "", url);
  updateScenarioDescription(scenarioId);
});

window.addEventListener("popstate", () => {
  scenarioDropdown.value = tryGetScenarioFromQuery();
  updateScenarioDescription(scenarioDropdown.value);
});

///////////////////////////
// Set up Click Handlers //
///////////////////////////

document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./scenarios/${scenarioDropdown.value}/index.js`);
  const iframe = await getTrackedIframe(`./scenarios/${scenarioDropdown.value}/iframe.js`, ++runCount, window.finalizationRegistry);
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
  window.finalizationRegistry = initializeFinalizationRegistry();
  console.log("Scenario reset.");
};

const gcFlagsModal = new bootstrap.Modal(document.getElementById("gc-flags-modal"));

document.getElementById("collect-garbage").onclick = async () => {
  if (window.gc) {
    await window.gc?.({ execution: "async" });
    console.log("Garbage collection finished.");
  } else {
    gcFlagsModal.show();
    console.warn("Unable to trigger garbage collection - please run with --expose-gc flag.");
  }
};
