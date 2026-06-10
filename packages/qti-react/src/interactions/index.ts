import type { InteractionDescriptor } from "../runtime";

import { choiceInteraction } from "./choice";
import { inlineChoiceInteraction } from "./inline-choice";
import { textEntryInteraction } from "./text-entry";

export { choiceInteraction } from "./choice";
export { inlineChoiceInteraction } from "./inline-choice";
export { textEntryInteraction } from "./text-entry";

/** The v0 interaction set conform-ed ships; emergent assembles these plus its extensions. */
export const qtiCoreInteractions: readonly InteractionDescriptor[] = [
  choiceInteraction,
  textEntryInteraction,
  inlineChoiceInteraction,
];
