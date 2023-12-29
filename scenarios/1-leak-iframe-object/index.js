window.leakedIframeRetainers = new Set();

export const runScenario = (iframe) => {
  const iframeObject = iframe.contentWindow.getIframeObject();
  window.leakedIframeRetainers.add(iframeObject);
};
