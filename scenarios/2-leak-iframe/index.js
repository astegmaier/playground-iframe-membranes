window.leakedIframeRetainers = new Set();

export const runScenario = (iframe) => {
  window.leakedIframeRetainers.add(iframe);
};
