importScripts("https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js");

onmessage = async (e) => {
  const scriptUrl = e.data;
  const response = await fetch(scriptUrl);
  const tsCode = await response.text();
  const output = ts.transpileModule(tsCode, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
  postMessage({ scriptUrl, transpiledCode: output.outputText });
};
