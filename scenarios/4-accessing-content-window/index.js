export function runScenario(iframe) {
  const didEqual = iframe.contentWindow === iframe.contentWindow.window;
  console.log(`iframe.contentWindow === iframe.contentWindow.window: ${didEqual}`);
}
