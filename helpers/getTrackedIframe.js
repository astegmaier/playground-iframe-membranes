import { updateRunStatus } from "./updateRunStatus.js";

/**
 * Creates a new iframe inside a container that displays GC status, and tracks the iframe and iframe.contentWindow using a FinalizationRegistry.
 * @param {string} scriptUrl Path to the script to load inside the iframe.
 * @param {number} runNumber A number that distinguishes this "run" from others (scenarios can be run more than once).
 * @param {IframeFinalizationRegistry} finalizationRegistry The registry used to track garbage collection status.
 * @returns {Promise<HTMLIFrameElement>}
 */
export async function getTrackedIframe(scriptUrl, runNumber, finalizationRegistry) {
  const iframeContainer = getIframeContainer(runNumber);
  const iframe = await getIframe(scriptUrl, iframeContainer);
  updateRunStatus(runNumber, "Attached", "Attached");
  console.log(`Creating iframe ${runNumber}.`);
  finalizationRegistry.register(iframe, { runNumber, kind: "iframe" });
  finalizationRegistry.register(iframe.contentWindow, { runNumber, kind: "iframe-window" });
  return iframe;
}

/**
 * Creates an iframe and returns it when it is loaded.
 * @param {string} scriptUrl Url of the script to run inside the iframe.
 * @param {HTMLDivElement} container Container to append the iframe to.
 * @returns {Promise<HTMLIFrameElement>}
 */
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

/**
 * Creates a container to render an iframe and show details about it.
 * @param {number} runNumber A number that distinguishes this "run" from others (scenarios can be run more than once).
 * @returns {HTMLDivElement} The container that the iframe can render it.
 */
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
  document.getElementById("all-runs-container")?.appendChild(runContainer);

  return iframeContainer;
}
