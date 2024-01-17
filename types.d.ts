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
  namespace mermaid {
    interface RunOptions {
      /**
       * The query selector to use when finding elements to render. Default: `".mermaid"`.
       */
      querySelector?: string;
      /**
       * The nodes to render. If this is set, `querySelector` will be ignored.
       */
      nodes?: ArrayLike<HTMLElement>;
      /**
       * A callback to call after each diagram is rendered.
       */
      postRenderCallback?: (id: string) => unknown;
      /**
       * If `true`, errors will be logged to the console, but not thrown. Default: `false`
       */
      suppressErrors?: boolean;
    }

    /**
     * Function that goes through the document to find the chart definitions in there and render them.
     *
     * The function tags the processed attributes with the attribute data-processed and ignores found
     * elements with the attribute already set. This way the init function can be triggered several
     * times.
     *
     * ```mermaid
     * graph LR;
     *  a(Find elements)-->b{Processed}
     *  b-->|Yes|c(Leave element)
     *  b-->|No |d(Transform)
     * ```
     *
     * @param options - Optional runtime configs
     */
    function run(options?: RunOptions): Promise<void>;
  }
  namespace ts {
    function transpileModule(
      code: string,
      options: {
        fileName?: string;
        compilerOptions: {
          module?: ModuleKind;
          inlineSources?: boolean;
          inlineSourceMap?: boolean;
          sourceRoot?: string;
        };
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

  type CreateMembraneFunction = <T extends object>(target: T) => { membrane: T; revoke?: () => void };
}

// This is necessary to make typescript tread this d.ts file as a module, rather than a global file.
export type {};
