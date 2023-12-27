import { updateRunStatus } from "./updateRunStatus.js";

export async function getTrackedIframe(scriptUrl, runNumber) {
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
