/**
 * Updates an iframe container's UI with garbage collection status information.
 * @param {number} runNumber A number that distinguishes this "run" from others (scenarios can be run more than once).
 * @param {string | undefined} iframeStatus Garbage collection status for the HTMLIframeElement.
 * @param {string | undefined} iframeWindowStatus Garbage collection status for the iframe's contentWindow.
 */
export function updateRunStatus(runNumber, iframeStatus, iframeWindowStatus) {
  if (iframeStatus) {
    document.getElementById(`status-iframe-${runNumber}`).textContent = `Iframe: ${iframeStatus}`;
  }
  if (iframeWindowStatus) {
    document.getElementById(`status-iframe-window-${runNumber}`).textContent = `Iframe Window: ${iframeWindowStatus}`;
  }
}
