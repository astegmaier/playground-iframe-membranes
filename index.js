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
  fetch(`/${currentScenario}/description.md`)
    .then((response) => response.blob())
    .then((blob) => blob.text())
    .then(
      (markdown) =>
        (document.getElementById("scenario-description").innerHTML =
          marked.parse(markdown))
    );
}
updateScenario();

let runCount = 0;

async function getTrackedIframe(scriptUrl) {
  runCount += 1;
  const iframeContainer = getIframeContainer(runCount);
  const iframe = await getIframe(scriptUrl, iframeContainer);
  console.log(`Creating iframe ${runCount}.`);
  window.finalizationRegistry.register(
    iframe.contentWindow,
    `iframe.contentWindow ${runCount}`
  );
  window.finalizationRegistry.register(iframe, `iframe ${runCount}`);
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
  iframeStatus = document.createElement("div");
  iframeStatus.id = `status-iframe-${runNumber}`;
  iframeWindowStatus = document.createElement("div");
  iframeWindowStatus.id = `status-iframe-window-${runNumber}`;

  const statusContainer = document.createElement("div");
  statusContainer.className = "status-container";
  statusContainer.appendChild(iframeStatus);
  statusContainer.appendChild(iframeWindowStatus);

  const iframeContainer = document.createElement("div");
  iframeContainer.id = `iframe-container-${runNumber}`;
  iframeContainer.className = "iframe-container";

  const runContainer = document.createElement("div");
  runContainer.className = "run-container";
  runContainer.appendChild(iframeContainer);
  runContainer.appendChild(statusContainer);

  document.getElementById("all-runs-container").appendChild(runContainer);
  updateRunStatus(runNumber);
  return iframeContainer;
}

function updateRunStatus(
  runNumber,
  iframeStatus = "Attached",
  iframeWindowStatus = "Attached"
) {
  document.getElementById(
    `status-iframe-${runNumber}`
  ).textContent = `Iframe: ${iframeStatus}`;
  document.getElementById(
    `status-iframe-window-${runNumber}`
  ).textContent = `Iframe Window: ${iframeWindowStatus}`;
}

document.getElementById("remove-iframes").onclick = () => {
  for (let i = 1; i <= runCount; i++) {
    const iframeContainer = document.getElementById(`iframe-container-${i}`);
    iframeContainer.textContent = "";
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
    console.log(
      "Unable to trigger garbage collection - please run with --expose-gc flag."
    );
  }
};

function initializeFinalizationRegistry() {
  window.finalizationRegistry = new FinalizationRegistry((objectType) => {
    console.log(`Cleaned up ${objectType}`);
  });
}
initializeFinalizationRegistry();
