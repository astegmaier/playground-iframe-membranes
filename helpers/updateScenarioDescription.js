/**
 * Updates the UI in the app that describes the scenario and displays the code that will run inside the iframe and the main page.
 * @param {string} scenarioId
 */
export function updateScenarioDescription(scenarioId) {
  fetch(`./${scenarioId}/index.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`./${scenarioId}/iframe.js`)
    .then((response) => response.text())
    .then((code) => (document.getElementById("code-iframe").textContent = code))
    .then(() => hljs.highlightAll());
  fetch(`./${scenarioId}/index.md`)
    .then((response) => response.blob())
    .then((blob) => blob.text())
    .then((markdown) => (document.getElementById("scenario-description").innerHTML = marked.parse(markdown)));
}
