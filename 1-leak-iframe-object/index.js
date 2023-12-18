window.iframeObjectRetainers = new Set();

export const runScenario = (iframe) => {
    window.iframeObjectRetainers.add(iframe.contentWindow.getIframeObject());
}