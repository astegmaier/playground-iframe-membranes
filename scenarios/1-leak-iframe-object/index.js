window.leakedIframeRetainers = new Set();

export function runScenario(iframe) {
  const iframeObject = iframe.contentWindow.getIframeObject();
  window.leakedIframeRetainers.add(iframeObject);
}
