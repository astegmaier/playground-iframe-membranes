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

// The HTML form controls are the "source of truth" for our app's state.
const scenarioDropdown = /** @type {HTMLSelectElement} */ (document.getElementById("scenario"));
const validScenarios = new Set(Array.from(scenarioDropdown.options).map((option) => option.value));
const continuousGcCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("enable-continuous-garbage-collection"));
const applyProxyCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("apply-proxy-checkbox"));

// Set the initial state from the url, if possible.
function trySetStateFromQuery() {
  const searchParams = new URLSearchParams(window.location.search);
  const scenarioId = searchParams.get("scenario");
  scenarioDropdown.value = validScenarios.has(scenarioId) ? scenarioId : scenarioDropdown.options[0].value;
  const applyProxy = searchParams.get("applyProxy");
  applyProxyCheckbox.checked = applyProxy?.toLowerCase() === "true" ? true : false;
  // TODO: maybe we should refactor the way we're storing state to avoid duplicating this code with the applyProxyCheckbox.onchange handler.
  if (applyProxyCheckbox.checked) {
    document.getElementById("collect-garbage").textContent = "Revoke Proxy and Collect Garbage";
  } else {
    document.getElementById("collect-garbage").textContent = "Collect Garbage";
  }
}
trySetStateFromQuery();
updateScenarioDescription(scenarioDropdown.value);

// Changes to the controls where the state is stored should be reflected in the url and the app UI (and vice versa).
scenarioDropdown.onchange = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("scenario", scenarioDropdown.value);
  history.pushState({}, "", url);
  updateScenarioDescription(scenarioDropdown.value);
  resetRuns();
  updateUsedJsHeapSize();
};

applyProxyCheckbox.onchange = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("applyProxy", applyProxyCheckbox.checked.toString());
  history.pushState({}, "", url);
  if (applyProxyCheckbox.checked) {
    document.getElementById("collect-garbage").textContent = "Revoke Proxy and Collect Garbage";
  } else {
    document.getElementById("collect-garbage").textContent = "Collect Garbage";
  }
};

window.addEventListener("popstate", () => {
  trySetStateFromQuery();
  updateScenarioDescription(scenarioDropdown.value);
  resetRuns();
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

// Display javascript heap size, if possible, and keep it up-to-date.
async function updateUsedJsHeapSize() {
  if (continuousGcCheckbox.checked) {
    await window.gc?.({ execution: "async" });
  }
  try {
    const heapSize = (performance.memory.totalJSHeapSize / Math.pow(1000, 2)).toFixed(2);
    document.getElementById("heap-size-display").textContent = heapSize;
  } catch (e) {
    document.getElementById("heap-size-display").textContent = "###";
  }
}
setInterval(updateUsedJsHeapSize, 250);

// We want to continuously garbage collect by default, if possible.
if (window.gc) {
  continuousGcCheckbox.checked = true;
} else {
  continuousGcCheckbox.disabled = true;
}

///////////////////////////
// Set up Click Handlers //
///////////////////////////

const proxyRevokeFns = new Set();

document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./scenarios/${scenarioDropdown.value}/index.js`);
  let iframe = await getTrackedIframe(`./scenarios/${scenarioDropdown.value}/iframe.js`, ++runCount, window.finalizationRegistry);
  if (applyProxyCheckbox.checked) {
    console.log("Applying proxy...");
    const solutionModule = await import(`./solution.js`);
    const { proxy, revoke } = solutionModule.createRevocableProxy(iframe);
    iframe = proxy;
    proxyRevokeFns.add(revoke);
  }
  console.log(`Running scenario ${scenarioDropdown.value} - ${runCount}...`);
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

function resetRuns() {
  runCount = 0;
  document.getElementById("all-runs-container").textContent = "";
  window.finalizationRegistry = initializeFinalizationRegistry();
  console.log("Scenario tests reset.");
}
document.getElementById("reset-runs").onclick = resetRuns;

const gcFlagsModal = new bootstrap.Modal(document.getElementById("gc-flags-modal"));

document.getElementById("collect-garbage").onclick = async () => {
  if (applyProxyCheckbox.checked) {
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
};

document.getElementById("enable-continuous-garbage-collection-info-button").onclick = () => {
  gcFlagsModal.show();
};
