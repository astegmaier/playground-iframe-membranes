declare module "https://cdn.skypack.dev/markdown-it" {
  function markdownit(): { render(markdwon: string): string };
  export default markdownit;
}

declare module "https://cdn.skypack.dev/highlight.js" {
  const hljs: { highlightElement(element: HTMLElement): void };
  export default hljs;
}

type IframeFinalizationRegistry = FinalizationRegistry<{ runNumber: number; kind: "iframe" | "iframe-window" }>;

declare global {
  namespace bootstrap {
    class Modal {
      constructor(target: HTMLElement, options?: any);
      public show(): void;
    }
  }
  interface Window {
    finalizationRegistry: IframeFinalizationRegistry;
    gc: (options: { execution: "async" }) => Promise<void>;
  }
  interface Performance {
    memory?: { usedJSHeapSize?: number };
  }
}

// This is necessary to make typescript tread this d.ts file as a module, rather than a global file.
export type {};
