type IframeFinalizationRegistry = FinalizationRegistry<{ runNumber: number; kind: "iframe" | "iframe-window" }>;

interface Window {
  finalizationRegistry: IframeFinalizationRegistry;
  gc: (options: { execution: "async" }) => Promise<void>;
}

declare module "https://cdn.skypack.dev/markdown-it" {
  function markdownit(): { render(markdwon: string): string };
  export default markdownit;
}

declare module "https://cdn.skypack.dev/highlight.js" {
  const hljs: { highlightElement(element: HTMLElement): void };
  export default hljs;
}
