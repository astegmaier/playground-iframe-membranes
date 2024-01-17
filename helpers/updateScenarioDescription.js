// const renderer = new marked.Renderer();
// renderer.code = function (code, language) {
//   if (code.match(/^sequenceDiagram/) || code.match(/^graph/)) {
//     return '<pre class="mermaid">' + code + "</pre>";
//   } else {
//     return "<pre><code>" + code + "</code></pre>";
//   }
// };
// marked.use(renderer);

/**
 * Updates the UI in the app that describes the scenario and displays the code that will run inside the iframe and the main page.
 * @param {string} scenarioId String identifying the scenario. These should correspond to folders inside the "scenarios" folder.
 */
export async function updateScenarioDescription(scenarioId) {
  await Promise.all([
    fetch(`./scenarios/${scenarioId}/index.js`)
      .then((response) => response.text())
      .then((code) => {
        const codeContainer = document.getElementById("code");
        codeContainer.textContent = code;
        delete codeContainer.dataset.highlighted;
        hljs.highlightElement(codeContainer);
      }),
    fetch(`./scenarios/${scenarioId}/iframe.js`)
      .then((response) => response.text())
      .then((code) => {
        const iframeCodeContainer = document.getElementById("code-iframe");
        iframeCodeContainer.textContent = code;
        delete iframeCodeContainer.dataset.highlighted;
        hljs.highlightElement(iframeCodeContainer);
      }),
    fetch(`./scenarios/${scenarioId}/index.md`)
      .then((response) => response.text())
      .then((markdown) => (document.getElementById("scenario-description").innerHTML = marked.parse(markdown)))
      .then(async () => {
        const codeElements = /** @type {NodeListOf<HTMLElement>} */ (
          document.getElementById("solution-description").querySelectorAll(".language-typescript, .language-javascript")
        );
        codeElements.forEach((codeElement) => {
          delete codeElement.dataset.highlighted;
          hljs.highlightElement(codeElement);
        });
        const mermaidElements = /** @type {NodeListOf<HTMLElement>} */ (
          document.getElementById("solution-description").querySelectorAll(".language-mermaid")
        );
        if (mermaidElements.length === 0) return;
        mermaidElements.forEach((mermaidElement) => mermaidElement.classList.add("mermaid"));
        await mermaid.run();
      }),
  ]);
}
