window.iframeObjectRetainers = new Set();

document.getElementById("add-iframe").onclick = async () => {
  const iframe = await getTrackedIframe();
  window.iframeObjectRetainers.add(iframe.contentWindow.getIframeObject());
};

let iframeCount = 0;
async function getTrackedIframe() {
  const iframe = await getIframe();
  iframeCount += 1;
  console.log(`Creating iframe ${iframeCount}.`);
  iframe.DEBUG_ID = iframeCount;
  iframe.contentWindow.DEBUG_ID = iframeCount;
  window.finalizationRegistry.register(
    iframe.contentWindow,
    `iframe.contentWindow ${iframeCount}`
  );
  window.finalizationRegistry.register(iframe, `iframe ${iframeCount}`);
  return iframe;
}

function getIframe() {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="./iframe.js"></script>
      </head>
      <body>
        <h1>Hi, I am an iframe.</h1>
      </body>
      </html>
    `;
    document.getElementById("iframe-container").appendChild(iframe);
  });
}

document.getElementById("remove-iframes").onclick = () => {
  document.getElementById("iframe-container").textContent = "";
  console.log("All iframes removed.");
};

document.getElementById("collect-garbage").onclick = async () => {
  if (window.gc) {
    await window.gc?.({ execution: "async" });
    console.log("Garbage collection finished.");
  } else {
    console.log(
      "Unable to trigger garbage collection - please run with --expose-gc flag."
    );
  }
};

window.finalizationRegistry = new FinalizationRegistry((objectType) => {
  console.log(`Cleaned up ${objectType}`);
});
