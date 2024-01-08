/**
 * Updates the UI in the app that describes the scenario and displays the code that will run inside the iframe and the main page.
 * @param {string} scenarioId String identifying the scenario. These should correspond to folders inside the "scenarios" folder.
 */
export function updateScenarioDescription(scenarioId) {
  fetch(`./scenarios/${scenarioId}/index.js`)
    .then((response) => response.text())
    .then((code) => {
      const codeContainer = document.getElementById("code");
      codeContainer.textContent = code;
      delete codeContainer.dataset.highlighted;
      hljs.highlightElement(codeContainer);
    });
  fetch(`./scenarios/${scenarioId}/iframe.js`)
    .then((response) => response.text())
    .then((code) => {
      const iframeCodeContainer = document.getElementById("code-iframe");
      iframeCodeContainer.textContent = code;
      delete iframeCodeContainer.dataset.highlighted;
      hljs.highlightElement(iframeCodeContainer);
    });
  fetch(`./scenarios/${scenarioId}/index.md`)
    .then((response) => response.text())
    .then((markdown) => (document.getElementById("scenario-description").innerHTML = marked.parse(markdown)));
}
