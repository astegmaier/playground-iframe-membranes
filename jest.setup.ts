import { createMembrane as baseline } from "./solutions/1-baseline/index";
import { createMembrane as withRevoke } from "./solutions/2-store-revoke-in-weakrefs/index";
import { createMembrane as harmonyExample } from "./solutions/3-harmony-reflect-example/index";
import { createMembrane as harmonyRevoke } from "./solutions/4-harmony-reflect-example-revocable/index";
import { createMembrane as tc39Example } from "./solutions/5-tc39-unit-test-example/index";
import { createMembrane as tc39Revoke } from "./solutions/6-tc39-unit-test-example-revocable/index";
import { createMembrane as esMembraneExample } from "./solutions/7-es-membrane-example/index";
import {
  IS_PROXY_SYMBOL,
  createMembrane as preserveIdentity,
  ProxyIdentityCache,
} from "./solutions/8-preserve-identity/index";
// TODO: Why does typescript not find this module?
require("dotenv").config();

/** Adapter for the "preserveIdentity" implementation that enables it to work correctly with es-membrane tests by providing getMembraneProxy and getMembraneValue implementations */
const preserveIdentityWithEsMembraneHelpers: CreateMembraneFunction = (target) => {
  const proxyIdentityCache = new ProxyIdentityCache();
  const { membrane, revoke } = preserveIdentity(target, { proxyIdentityCache });
  return {
    membrane,
    revoke,
    getMembraneProxy: (side, value) => {
      if (side === "wet") {
        const foundValue = proxyIdentityCache.dryMap.has(value) ? value : undefined;
        return [!!foundValue, foundValue];
      } else {
        const foundValue = proxyIdentityCache.wetMap.has(value) ? value : undefined;
        return [!!foundValue, foundValue];
      }
    },
    getMembraneValue: (side, value) => {
      const foundDryKey = proxyIdentityCache.dryMap.has(value) ? value : undefined;
      const foundDryValue = proxyIdentityCache.dryMap.get(value)?.deref() as any;
      const foundWetKey = proxyIdentityCache.wetMap.has(value) ? value : undefined;
      const foundWetValue = proxyIdentityCache.wetMap.get(value)?.deref() as any;
      const unproxiedObjects = [foundDryKey, foundDryValue, foundWetKey, foundWetValue].filter(
        (obj) => !!obj && obj?.[IS_PROXY_SYMBOL] !== true
      );
      if (unproxiedObjects.length > 1) {
        throw new Error("We shouldn't find the same value twice in the same proxyIdentityCache!");
      }
      const foundValue = unproxiedObjects[0];
      return [!!foundValue, foundValue];
    },
  };
};

const membbraneMap = {
  1: ["baseline", baseline],
  2: ["with revoke", withRevoke],
  3: ["harmony-reflect example", harmonyExample],
  4: ["harmony-reflect with revoke", harmonyRevoke],
  5: ["tc39 example", tc39Example],
  6: ["tc39 with revoke", tc39Revoke],
  7: ["es-membrane example", esMembraneExample],
  8: ["preserve identity", preserveIdentityWithEsMembraneHelpers],
};

const membraneArray = process.env.JEST_MEMBRANE
  ? process.env.JEST_MEMBRANE.split(" ")
      .filter((value) => Object.hasOwn(membbraneMap, value))
      .map((value) => (membbraneMap as any)[value])
  : [membbraneMap[8]];
console.log("Using membranes:", membraneArray.map((value) => value[0]).join(", "));
globalThis.membranes = membraneArray;
