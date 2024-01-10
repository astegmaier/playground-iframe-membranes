/**
 * Transpiles a .ts file and imports it as if it were a .js file.
 * @param {string} path The path to the typescript file
 * @returns
 */
export async function transpileAndImport(path) {
  // Fetch the code as text.
  const response = await fetch(path);
  const code = await response.text();

  // Transpile the code with typescript.
  const transpiledCode = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ES2022 } });

  // create a data URI with the code as a base64 string
  const dataURI = "data:text/javascript;base64," + btoa(transpiledCode.outputText);

  // import the data URI as a module
  return await import(dataURI);
}
