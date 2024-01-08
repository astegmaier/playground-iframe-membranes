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
  updateUsedJsHeapSize();
});

window.addEventListener("popstate", () => {
  scenarioDropdown.value = tryGetScenarioFromQuery();
  updateScenarioDescription(scenarioDropdown.value);
  updateUsedJsHeapSize();
});

// Display the proxy "solution" code.
fetch(`./solution.js`)
  .then((response) => response.text())
  .then((code) => {
    const iframeCodeContainer = document.getElementById("code-solution");
    iframeCodeContainer.textContent = code;
    hljs.highlightElement(iframeCodeContainer);
  });

// Display javascript heap size, if possible.
function updateUsedJsHeapSize() {
  try {
    const heapSize = (performance.memory.usedJSHeapSize / Math.pow(1000, 2)).toFixed(4);
    document.getElementById("heap-size-display").textContent = heapSize;
  } catch (e) {
    document.getElementById("heap-size-display").textContent = "###";
  }
}

///////////////////////////
// Set up Click Handlers //
///////////////////////////

const proxyRevokeFns = new Set();

document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./scenarios/${scenarioDropdown.value}/index.js`);
  let iframe = await getTrackedIframe(`./scenarios/${scenarioDropdown.value}/iframe.js`, ++runCount, window.finalizationRegistry);
  if (shouldApplyProxy()) {
    console.log("Applying proxy...");
    const solutionModule = await import(`./solution.js`);
    const { proxy, revoke } = solutionModule.createRevocableProxy(iframe);
    iframe = proxy;
    proxyRevokeFns.add(revoke);
  }
  console.log(`Running scenario ${scenarioDropdown.value} - ${runCount}...`);
  await scenarioModule.runScenario(iframe);
  updateUsedJsHeapSize();
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
  updateUsedJsHeapSize();
};

document.getElementById("reset-scenario").onclick = () => {
  runCount = 0;
  document.getElementById("all-runs-container").textContent = "";
  window.finalizationRegistry = initializeFinalizationRegistry();
  console.log("Scenario reset.");
  updateUsedJsHeapSize();
};

const gcFlagsModal = new bootstrap.Modal(document.getElementById("gc-flags-modal"));

document.getElementById("collect-garbage").onclick = async () => {
  if (shouldApplyProxy()) {
    console.log(`Revoking ${proxyRevokeFns.size} proxies...`);
    proxyRevokeFns.forEach((revoke) => revoke());
    proxyRevokeFns.clear();
  }
  if (window.gc) {
    await window.gc?.({ execution: "async" });
    console.log("Garbage collection finished.");
  } else {
    gcFlagsModal.show();
    console.warn("Unable to trigger garbage collection - please run with --expose-gc flag.");
  }
  updateUsedJsHeapSize();
};

document.getElementById("gc-flags-info-button").onclick = () => {
  gcFlagsModal.show();
};

document.getElementById("update-heap-size").onclick = () => {
  updateUsedJsHeapSize();
};

function shouldApplyProxy() {
  return /** @type {HTMLInputElement} */ (document.getElementById("apply-proxy-checkbox")).checked;
}

document.getElementById("apply-proxy-checkbox").onchange = (e) => {
  if (shouldApplyProxy()) {
    document.getElementById("collect-garbage").textContent = "Revoke Proxy and Collect Garbage";
  } else {
    document.getElementById("collect-garbage").textContent = "Collect Garbage";
  }
};
