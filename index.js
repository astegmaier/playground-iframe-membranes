document.getElementById("run-scenario").onclick = async () => {
  const scenarioModule = await import(`./${currentScenario}/index.js`);
  const iframe = await getTrackedIframe(`./${currentScenario}/iframe.js`);
  await scenarioModule.runScenario(iframe);
};

const scenarioDropdown = document.getElementById("scenario");
scenarioDropdown.onchange = updateScenario;
let currentScenario;
function updateScenario() {
  currentScenario = scenarioDropdown.value;
  fetch(`./${currentScenario}/index.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`./${currentScenario}/iframe.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code-iframe").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`/${currentScenario}/description.md`)
    .then((response) => response.blob())
    .then((blob) => blob.text())
    .then(
      (markdown) =>
        (document.getElementById("scenario-description").innerHTML =
          marked.parse(markdown))
    );
}
updateScenario();

let iframeCount = 0;

async function getTrackedIframe(scriptUrl) {
  const iframe = await getIframe(scriptUrl);
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

function getIframe(scriptUrl) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="text/javascript" src="${scriptUrl}"></script>
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
