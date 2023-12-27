document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./${currentScenario}/index.js`);
  const iframe = await getTrackedIframe(`./${currentScenario}/iframe.js`);
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

async function getTrackedIframe(scriptUrl) {
  runCount += 1;
  const runNumber = runCount;
  const iframeContainer = getIframeContainer(runNumber);
  const iframe = await getIframe(scriptUrl, iframeContainer);
  updateRunStatus(runNumber, "Attached", "Attached");
  console.log(`Creating iframe ${runNumber}.`);
  window.finalizationRegistry.register(iframe, JSON.stringify({ runNumber, kind: "iframe" }));
  window.finalizationRegistry.register(iframe.contentWindow, JSON.stringify({ runNumber, kind: "iframe-window" }));
  return iframe;
}

function getIframe(scriptUrl, container) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="${scriptUrl}"></script>
      </head>
      <body>
        <h1>Hi, I am an iframe.</h1>
      </body>
      </html>
    `;
    container.appendChild(iframe);
  });
}

function getIframeContainer(runNumber) {
  const runNumberLabel = document.createElement("div");
  runNumberLabel.textContent = `Run ${runNumber}`;
  const iframeStatus = document.createElement("div");
  iframeStatus.id = `status-iframe-${runNumber}`;
  const iframeWindowStatus = document.createElement("div");
  iframeWindowStatus.id = `status-iframe-window-${runNumber}`;

  const statusContainer = document.createElement("div");
  statusContainer.className = "status-container";
  statusContainer.appendChild(runNumberLabel);
  statusContainer.appendChild(iframeStatus);
  statusContainer.appendChild(iframeWindowStatus);

  const iframeContainer = document.createElement("div");
  iframeContainer.id = `iframe-container-${runNumber}`;
  iframeContainer.className = "iframe-container";

  const runContainer = document.createElement("div");
  runContainer.className = "run-container";
  runContainer.appendChild(statusContainer);
  runContainer.appendChild(iframeContainer);
  document.getElementById("all-runs-container").appendChild(runContainer);

  return iframeContainer;
}

function updateRunStatus(runNumber, iframeStatus, iframeWindowStatus) {
  if (iframeStatus) {
    document.getElementById(`status-iframe-${runNumber}`).textContent = `Iframe: ${iframeStatus}`;
  }
  if (iframeWindowStatus) {
    document.getElementById(`status-iframe-window-${runNumber}`).textContent = `Iframe Window: ${iframeWindowStatus}`;
  }
}

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

function initializeFinalizationRegistry() {
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
initializeFinalizationRegistry();
