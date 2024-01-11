declare global {
  type IframeFinalizationRegistry = FinalizationRegistry<{ runNumber: number; kind: "iframe" | "iframe-window" }>;
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
  namespace ts {
    function transpileModule(
      code: string,
      options: {
        fileName?: string;
        compilerOptions: { module?: ModuleKind; inlineSources?: boolean; inlineSourceMap?: boolean; sourceRoot?: string };
      }
    ): { outputText: string };
    enum ModuleKind {
      None = 0,
      CommonJS = 1,
      AMD = 2,
      UMD = 3,
      System = 4,
      ES2015 = 5,
      ES2020 = 6,
      ES2022 = 7,
      ESNext = 99,
      Node16 = 100,
      NodeNext = 199,
    }
  }
  interface Window {
    finalizationRegistry: IframeFinalizationRegistry;
    gc: (options: { execution: "async" }) => Promise<void>;
  }
  interface Performance {
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number };
  }
}

// This is necessary to make typescript tread this d.ts file as a module, rather than a global file.
export type {};
