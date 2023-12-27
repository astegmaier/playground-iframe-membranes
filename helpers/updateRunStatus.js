export function updateRunStatus(runNumber, iframeStatus, iframeWindowStatus) {
  if (iframeStatus) {
    document.getElementById(`status-iframe-${runNumber}`).textContent = `Iframe: ${iframeStatus}`;
  }
  if (iframeWindowStatus) {
    document.getElementById(`status-iframe-window-${runNumber}`).textContent = `Iframe Window: ${iframeWindowStatus}`;
  }
}
