import { createMembrane as baseline } from "./solutions/1-baseline/index";
import { createMembrane as withRevoke } from "./solutions/2-store-revoke-in-weakrefs/index";
import { createMembrane as harmonyExample } from "./solutions/3-harmony-reflect-example/index";
import { createMembrane as harmonyRevoke } from "./solutions/4-harmony-reflect-example-revocable/index";
import { createMembrane as tc39Example } from "./solutions/5-tc39-unit-test-example/index";
import { createMembrane as tc39Revoke } from "./solutions/6-tc39-unit-test-example-revocable/index";
import { createMembrane as esMembraneExample } from "./solutions/7-es-membrane-example/index";
import { createMembrane as preserveIdentity } from "./solutions/8-preserve-identity/index";
// TODO: Why does typescript not find this module?
require("dotenv").config();

const membbraneMap = {
  1: ["baseline", baseline],
  2: ["with revoke", withRevoke],
  3: ["harmony-reflect example", harmonyExample],
  4: ["harmony-reflect with revoke", harmonyRevoke],
  5: ["tc39 example", tc39Example],
  6: ["tc39 with revoke", tc39Revoke],
  7: ["es-membrane example", esMembraneExample],
  8: ["preserve identity", preserveIdentity],
};

const membraneArray = process.env.JEST_MEMBRANE
  ? process.env.JEST_MEMBRANE.split(" ")
      .filter((value) => Object.hasOwn(membbraneMap, value))
      .map((value) => (membbraneMap as any)[value])
  : [membbraneMap[8]];
console.log("Using membranes:", membraneArray.map((value) => value[0]).join(", "));
globalThis.membranes = membraneArray;
