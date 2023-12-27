import { getTrackedIframe } from "./helpers/getTrackedIframe.js";
import { updateRunStatus } from "./helpers/updateRunStatus.js";
import { initializeFinalizationRegistry } from "./helpers/initializeFinalizationRegistry.js";

initializeFinalizationRegistry();

document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./${currentScenario}/index.js`);
  const iframe = await getTrackedIframe(`./${currentScenario}/iframe.js`, ++runCount);
  await scenarioModule.runScenario(iframe);
};

const scenarioDropdown = document.getElementById("scenario");
scenarioDropdown.onchange = updateScenario;
let currentScenario;
function updateScenario() {
  currentScenario = scenarioDropdown.value;
  fetch(`./${currentScenario}/index.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`./${currentScenario}/iframe.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code-iframe").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`./${currentScenario}/index.md`)
    .then((response) => response.blob())
    .then((blob) => blob.text())
    .then((markdown) => (document.getElementById("scenario-description").innerHTML = marked.parse(markdown)));
}
updateScenario();

let runCount = 0;

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
