import markdownit from "https://cdn.skypack.dev/markdown-it";
import hljs from "https://cdn.skypack.dev/highlight.js";
const md = markdownit();

/**
 * Updates the UI in the app that describes the scenario and displays the code that will run inside the iframe and the main page.
 * @param {string} scenarioId
 */
export function updateScenarioDescription(scenarioId) {
  fetch(`./${scenarioId}/index.js`)
    .then((response) => response.text())
    .then((code) => {
      const codeContainer = document.getElementById("code");
      codeContainer.textContent = code;
      delete codeContainer.dataset.highlighted;
      hljs.highlightElement(codeContainer);
    });
  fetch(`./${scenarioId}/iframe.js`)
    .then((response) => response.text())
    .then((code) => {
      const iframeCodeContainer = document.getElementById("code-iframe");
      iframeCodeContainer.textContent = code;
      delete iframeCodeContainer.dataset.highlighted;
      hljs.highlightElement(iframeCodeContainer);
    });
  fetch(`./${scenarioId}/index.md`)
    .then((response) => response.text())
    .then((markdown) => (document.getElementById("scenario-description").innerHTML = md.render(markdown)));
}
