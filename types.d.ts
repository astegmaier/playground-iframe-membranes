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

  type CreateMembraneFunction = <T extends object>(
    target: T
  ) => {
    membrane: T;
    revoke?: () => void;
    /**
     * [ansteg note: this is only necessary to implement because it is exposed by es-membrane and used by its tests]
     * Get the proxy associated with a field name and another known value.
     *
     * @param field {Symbol|String}  The field to look for.
     * @param value {Variant} The key for the ProxyMapping map.
     *
     * @returns [
     *    {Boolean} True if the value was found.
     *    {Proxy}   The proxy for that field.
     * ] if field is not the value's origin field
     *
     * @returns [
     *    {Boolean} True if the value was found.
     *    {Variant} The actual value
     * ] if field is the value's origin field
     *
     * @returns [
     *    {Boolean} False if the value was not found.
     *    {Object}  NOT_YET_DETERMINED
     * ]
     */
    getMembraneProxy?: GetValueOrProxyFn;
    /**
     * [ansteg note: this is only necessary to implement because it is exposed by es-membrane and used by its tests]
     * Get the value associated with a field name and another known value.
     *
     * @param field {Symbol|String}  The field to look for.
     * @param value {Variant} The key for the ProxyMapping map.
     *
     * @returns [
     *    {Boolean} True if the value was found.
     *    {Variant} The value for that field.
     * ]
     *
     * @note This method is not used internally in the membrane, but only by debug
     * code to assert that we have the right values stored.  Therefore you really
     * shouldn't use it in Production.
     */
    getMembraneValue?: GetValueOrProxyFn;
  };
  type GetValueOrProxyFn = (side: "dry" | "wet", value: any) => [found: boolean, foundValue: any];
  var membranes: Array<[string, CreateMembraneFunction]>;
}

// This is necessary to make typescript tread this d.ts file as a module, rather than a global file.
export type {};
