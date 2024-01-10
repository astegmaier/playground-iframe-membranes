/**
 * Updates the UI in the app that describes the membrane solution and displays its code.
 * @param {string} solutionId String identifying the solution. These should correspond to folders inside the "solutions" folder.
 */
export function updateSolutionDescription(solutionId) {
  fetch(`./solutions/${solutionId}/index.js`)
    .then((response) => response.text())
    .then((code) => {
      const codeContainer = document.getElementById("code-solution");
      codeContainer.textContent = code;
      delete codeContainer.dataset.highlighted;
      hljs.highlightElement(codeContainer);
    });
  fetch(`./solutions/${solutionId}/index.md`)
    .then((response) => response.text())
    .then((markdown) => (document.getElementById("solution-description").innerHTML = marked.parse(markdown)));
}
