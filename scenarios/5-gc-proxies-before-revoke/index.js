export function runScenario(iframe) {
  const iframeObject = iframe.contentWindow.getIframeObject();
  console.log(
    `the wet side of the membrane retrieved iframeObject ${iframeObject.instanceNumber} but did not otherwise retain it.`
  );
  // After iframeObject goes out of scope it _should_ get garbage collected. If not, that's the bug..
}
