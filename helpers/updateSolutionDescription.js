/**
 * Updates the UI in the app that describes the membrane solution and displays its code.
 * @param {string} solutionId String identifying the solution. These should correspond to folders inside the "solutions" folder.
 */
export async function updateSolutionDescription(solutionId) {
  await Promise.all([
    fetch(`./solutions/${solutionId}/index.ts`)
      .then((response) => response.text())
      .then((code) => {
        const codeContainer = document.getElementById("code-solution");
        codeContainer.textContent = code;
        delete codeContainer.dataset.highlighted;
        hljs.highlightElement(codeContainer);
      }),
    fetch(`./solutions/${solutionId}/index.md`)
      .then((response) => response.text())
      .then((markdown) => (document.getElementById("solution-description").innerHTML = marked.parse(markdown)))
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
