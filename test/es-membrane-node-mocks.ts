// @ts-nocheck

/** We want to adapt tests that were written for es-membrane to our more generic createMembrane function. */
export class MockEsMembrane {
  constructor(private _getMembraneValue?: GetValueOrProxyFn, private _getMembraneProxy?: GetValueOrProxyFn) {}
  getMembraneValue: GetValueOrProxyFn = (side, value) => {
    if (!this._getMembraneValue) throw new Error("getMembraneValue is not implemented");
    return this._getMembraneValue(side, value);
  };
  getMembraneProxy: GetValueOrProxyFn = (side, value) => {
    if (!this._getMembraneProxy) throw new Error("getMembraneProxy is not implemented");
    return this._getMembraneProxy(side, value);
  };
}

interface MembraneMockParts {
  wet: {
    doc: any; // wetDocument,
    Node: any; // NodeWet,
    Element: any; // ElementWet,
  };
  dry: {
    doc: any; // dryDocument,
    Node: any; // NodeDry,
    Element: any; // ElementDry,
  };
  membrane: MockEsMembrane; //dryWetMB
}

/**
 * This function adapts the MembraneMocks function from es-membrane so that tests can be adapted to other implementations of createMembrane.
 */
export function MembraneMocksAdapter(
  createMembrane: CreateMembraneFunction,
  includeDamp?: any,
  logger?: any,
  mockOptions?: any
): MembraneMockParts {
  const parts: MembraneMockParts = MembraneMocks(includeDamp, logger, mockOptions);

  const { membrane, revoke, getMembraneValue, getMembraneProxy } = createMembrane(parts.wet);
  parts.dry = { ...membrane };

  // ansteg: We emulate the way that es-membrane does revoking - through dispatching an 'unload' event.
  parts.wet.doc.dispatchEvent = (eventName: string) => {
    if (eventName === "unload") {
      revoke();
    }
  };

  parts.membrane = new MockEsMembrane(getMembraneValue, getMembraneProxy);
  return parts;
}

// This code was copied and adapted from the es-membrane project:
// See https://github.com/ajvincent/es-membrane/blob/master/old-0.9/docs/dist/node/mocks.js

var DAMP = Symbol("damp");
function MembraneMocks(includeDamp?, logger?, mockOptions?): any {
  "use strict";
  includeDamp = Boolean(includeDamp);
  if (!mockOptions) mockOptions = {};

  var Mocks = {};
  function EventTargetWet() {
    this.__events__ = [];
  }
  EventTargetWet.prototype.addEventListener = function (type, listener, isBubbling) {
    if (typeof listener == "function") {
      listener = { handleEvent: listener };
    }
    if (typeof listener !== "object" || listener === null || typeof listener.handleEvent !== "function")
      throw new Error("Invalid event listener!");
    this.__events__.push({
      type: type,
      listener: listener,
      isBubbling: Boolean(isBubbling),
    });
  };

  EventTargetWet.prototype.dispatchEvent = function (eventType) {
    let current = this.parentNode;
    let chain = [];
    while (current) {
      chain.unshift(current);
      current = current.parentNode;
    }

    let event = {
      type: eventType,
      currentPhase: 1,
    };

    for (let i = 0; i < chain.length; i++) chain[i].handleEventAtTarget(event);

    event.currentPhase = 2;
    this.handleEventAtTarget(event);

    chain = chain.reverse();
    event.currentPhase = 3;
    for (let i = 0; i < chain.length; i++) chain[i].handleEventAtTarget(event);
  };

  EventTargetWet.prototype.handleEventAtTarget = function (event) {
    let handlers = this.__events__.slice(0);
    let length = handlers.length;
    for (let i = 0; i < length; i++) {
      let h = handlers[i];
      if (h.type !== event.type) continue;
      let hCode = h.isBubbling ? 4 - event.currentPhase : event.currentPhase;
      if (hCode === 3) continue;
      try {
        h.listener.handleEvent(event);
      } catch (e) {
        // do nothing
      }
    }
  };

  const wetMarker = {
    marker: "true",
  };

  function NodeWet(ownerDoc) {
    EventTargetWet.apply(this, arguments); // this takes care of event handling
    Object.defineProperty(this, "childNodes", new DataDescriptor([]));
    Object.defineProperty(this, "ownerDocument", new DataDescriptor(ownerDoc));
    Object.defineProperty(this, "parentNode", new DataDescriptor(null, true));

    // testing the set trap in a constructor properly marks a new non-primitive
    // property in the "wet" object graph.
    this.wetMarker = wetMarker;
  }
  NodeWet.prototype = new EventTargetWet();
  Object.defineProperties(NodeWet.prototype, {
    childNodes: NOT_IMPLEMENTED_DESC,
    nodeType: NOT_IMPLEMENTED_DESC,
    parentNode: NOT_IMPLEMENTED_DESC,
    insertBefore: new DataDescriptor(function (newChild, refChild) {
      if (!(newChild instanceof NodeWet)) {
        throw new Error("insertBefore expects a Node!");
      }
      if (refChild !== null && !(refChild instanceof NodeWet)) {
        throw new Error("insertBefore's refChild must be null or a Node!");
      }

      var index;
      if (refChild) {
        index = this.childNodes.indexOf(refChild);
      } else {
        index = this.childNodes.length;
      }

      if (index >= 0) {
        this.childNodes.splice(index, 0, newChild);
        newChild.parentNode = this;
        return newChild;
      }

      throw new Error("refChild is not a child of this node!");
    }),
    firstChild: new AccessorDescriptor(function () {
      if (this.childNodes.length > 0) {
        return this.childNodes[0];
      }
      return null;
    }),

    shouldNotBeAmongKeys: new DataDescriptor(false),
  });

  function ElementWet(ownerDoc, name) {
    NodeWet.apply(this, arguments); // this takes care of ownerDoc
    Object.defineProperty(this, "nodeType", new DataDescriptor(1));
    Object.defineProperty(this, "nodeName", new DataDescriptor(name));
  }
  ElementWet.prototype = new NodeWet(null);

  {
    assert(Object.getPrototypeOf(ElementWet.prototype) === NodeWet.prototype, "prototype chain mismatch of ElementWet");
    let k = new ElementWet({}, "k");
    assert(
      Object.getPrototypeOf(k) === ElementWet.prototype,
      "prototype chain mismatch of a created ElementWet instance"
    );
  }
  // A sample object for developing the Membrane module with.

  /* XXX ajvincent Don't make this object inherit from any prototypes.
   * Instead, test prototype inheritance through ElementWet.
   */

  const wetDocument = {
    ownerDocument: null,

    childNodes: [],
    nodeType: 9,
    nodeName: "#document",
    parentNode: null,

    get firstChild() {
      if (this.childNodes.length > 0) {
        return this.childNodes[0];
      }
      return null;
    },

    get baseURL() {
      return docBaseURL;
    },
    set baseURL(val) {
      if (typeof val != "string") throw new Error("baseURL must be a string");
      docBaseURL = val;
    },

    // EventListener
    __events__: [],
    addEventListener: EventTargetWet.prototype.addEventListener,
    dispatchEvent: EventTargetWet.prototype.dispatchEvent,
    handleEventAtTarget: EventTargetWet.prototype.handleEventAtTarget,

    shouldNotBeAmongKeys: false,

    membraneGraphName: "wet", // faking it for now
  };

  Object.defineProperty(wetDocument, "createElement", {
    value: function (name) {
      if (typeof name != "string") {
        throw new Error("createElement requires name be a string!");
      }
      return new ElementWet(this, name);
    },
    writable: false,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(wetDocument, "insertBefore", {
    value: function (newChild, refChild) {
      if (!(newChild instanceof NodeWet)) {
        throw new Error("insertBefore expects a Node!");
      }
      if (refChild !== null && !(refChild instanceof NodeWet)) {
        throw new Error("insertBefore's refChild must be null or a Node!");
      }
      var index;
      if (refChild) {
        index = this.childNodes.indexOf(refChild);
      } else {
        index = this.childNodes.length;
      }

      if (index >= 0) {
        this.childNodes.splice(index, 0, newChild);
        newChild.parentNode = this;
        return newChild;
      }

      throw new Error("refChild is not a child of this node!");
    },
    writable: false,
    enumerable: true,
    configurable: true,
  });
  /* We can get away with a var declaration here because everything is inside a
   closure.
*/
  var docBaseURL = "http://www.example.com/";

  Object.defineProperty(wetDocument, "rootElement", {
    value: wetDocument.createElement("root"),
    writable: false,
    enumerable: true,
    // "non-configurable objects cannot gain or lose properties"
    configurable: true,
  });

  assert(wetDocument.rootElement.ownerDocument == wetDocument, "wetDocument cyclic reference isn't correct");

  Mocks.wet = {
    doc: wetDocument,
    Node: NodeWet,
    Element: ElementWet,
  };

  // ansteg : I am commenting out this block because we want membrane and dry object creation to happen
  //          outside of this function so it can be adapted to other membrane implementations

  /**
  // First, set up the membrane, and register the "wet" form of "the document".
  var docMap, wetHandler;
  var dryWetMB = new Membrane({
    showGraphName: true,
    logger: typeof logger == "object" ? logger : null,
  });

  Mocks.membrane = dryWetMB;
  Mocks.handlers = {};

  {
    // Establish "wet" view of document.
    wetHandler = dryWetMB.getHandlerByName("wet", { mustCreate: true });
    Mocks.handlers.wet = wetHandler;
    // Mocks.wet is established in wetDocument.js

    if (typeof mockOptions.wetHandlerCreated == "function") mockOptions.wetHandlerCreated(wetHandler, Mocks);
  }
  // The "dry" part of the membrane's wet document.
  var ElementDry, NodeDry, dryDocument;
  {
    // Establish proxy handler for "dry" mode.
    let dryHandler = dryWetMB.getHandlerByName("dry", { mustCreate: true });
    Mocks.handlers.dry = dryHandler;
    Mocks.dry = {};

    if (typeof mockOptions.dryHandlerCreated == "function") mockOptions.dryHandlerCreated(dryHandler, Mocks);

    let found, doc;

    dryWetMB.convertArgumentToProxy(wetHandler, dryHandler, wetDocument);

    [found, doc] = dryWetMB.getMembraneValue("dry", wetDocument);
    assert(found, "Must find dryDocument from membrane wrapping of wetDocument");
    assert(doc === wetDocument, "Expected to get back the wet document");

    [found, doc] = dryWetMB.getMembraneProxy("dry", wetDocument);
    assert(found, "Must find dryDocument from membrane wrapping of wetDocument");
    assert(doc, "Expected to get back a proxy");
    assert(doc !== wetDocument, "Expected to get back the proxy for the wet document");
    dryDocument = doc;

    dryDocument.addEventListener(
      "unload",
      function () {
        if (typeof logger == "object" && logger !== null) logger.debug("Revoking all proxies in dry object graph");
        dryHandler.revokeEverything();
        if (typeof logger == "object" && logger !== null) logger.debug("Revoked all proxies in dry object graph");
      },
      true
    );

    Mocks.dry.doc = dryDocument;
  }

  {
    let dryHandler = dryWetMB.getHandlerByName("dry");
    dryWetMB.convertArgumentToProxy(wetHandler, dryHandler, ElementWet);
    let found;
    [found, ElementDry] = dryWetMB.getMembraneProxy("dry", ElementWet);
    assert(found, "ElementDry not found as a proxy!");

    Mocks.dry.Element = ElementDry;
  }

  {
    let dryHandler = dryWetMB.getHandlerByName("dry");
    dryWetMB.convertArgumentToProxy(wetHandler, dryHandler, NodeWet);
    let found;
    [found, NodeDry] = dryWetMB.getMembraneProxy("dry", NodeWet);
    assert(found, "NodeDry not found as a proxy!");

    Mocks.dry.Node = NodeDry;
  }
  function dampObjectGraph(parts) {
    parts.handlers[DAMP] = parts.membrane.getHandlerByName(DAMP, { mustCreate: true });

    if (typeof mockOptions.dampHandlerCreated == "function")
      mockOptions.dampHandlerCreated(parts.handlers[DAMP], parts);

    let keys = Object.getOwnPropertyNames(parts.wet);
    parts[DAMP] = {};
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      parts[DAMP][key] = parts.membrane.convertArgumentToProxy(
        parts.handlers.wet,
        parts.handlers[DAMP],
        parts.wet[key]
      );
    }
  }
   */

  // The bare essentials.
  /*
  var Mocks = {
    wet: {
      doc: wetDocument,
      Node: NodeWet,
      Element: ElementWet,
    },
    dry: {
      doc: dryDocument,
      Node: NodeDry,
      Element: ElementDry,
    },

    membrane: dryWetMB
  };
  */

  if (includeDamp) dampObjectGraph(Mocks);

  return Mocks;
}

// These are the dependencies of MembraneMocks, copied from:
// https://github.com/ajvincent/es-membrane/blob/master/old-0.9/docs/dist/node/utilities.js

function DataDescriptor(value, writable = false, enumerable = true, configurable = true) {
  this.value = value;
  this.writable = writable;
  this.enumerable = enumerable;
  this.configurable = configurable;
}

function AccessorDescriptor(getter, setter?, enumerable = true, configurable = true) {
  this.get = getter;
  this.set = setter;
  this.enumerable = enumerable;
  this.configurable = configurable;
}

const NOT_IMPLEMENTED_DESC = new AccessorDescriptor(NOT_IMPLEMENTED, NOT_IMPLEMENTED);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function NOT_IMPLEMENTED() {
  throw new Error("Not implemented!");
}
