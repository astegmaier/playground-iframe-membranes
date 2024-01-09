window.leakedIframeRetainers = new Set();

export function runScenario(iframe) {
  window.leakedIframeRetainers.add(iframe);
}
