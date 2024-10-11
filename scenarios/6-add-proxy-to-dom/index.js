let instanceNumber = 0;

export function runScenario(iframe) {
  const domElementProxy = iframe.contentWindow.getProxyToDomElement();
  document.appendChild(domElementProxy);
}
