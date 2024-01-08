type IframeFinalizationRegistry = FinalizationRegistry<{ runNumber: number; kind: "iframe" | "iframe-window" }>;

declare global {
  namespace bootstrap {
    class Modal {
      constructor(target: HTMLElement, options?: any);
      public show(): void;
    }
  }
  namespace marked {
    function parse(markdown: string): string;
  }
  namespace hljs {
    function highlightElement(element: HTMLElement): void;
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
