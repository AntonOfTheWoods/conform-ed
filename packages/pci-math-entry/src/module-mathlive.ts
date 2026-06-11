/**
 * The browser-ready math-entry PCI: MathLive input + checker verdicts. Heavy by
 * design (MathLive + compute-engine) — load via lazy import() just before an item
 * using the interaction mounts, and register with the consumer's PCI registry:
 *
 *   const { mathEntryModule } = await import("@conform-ed/pci-math-entry/module");
 *   registry.registerModule("math-entry", mathEntryModule);
 */

import { mathLiveInput } from "./mathlive-input";
import { createMathEntryModule } from "./module";

export const mathEntryModule = createMathEntryModule(mathLiveInput);
export { mathEntryTypeIdentifier } from "./module";
