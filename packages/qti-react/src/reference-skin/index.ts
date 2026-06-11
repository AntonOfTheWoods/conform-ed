/**
 * The Reference Skin (ADR-0001): the unstyled, semantic-HTML, a11y-correct Skin set
 * conform-ed ships so every interaction can be exercised, demoed, and conformance-
 * tested without a downstream product. Deliberately not a product UI: no styling
 * beyond data attributes (`data-qti-interaction`, `data-status`) as styling hooks.
 */

import type { SkinRegistry } from "../runtime";

import { AssociateReferenceSkin } from "./associate";
import { ChoiceReferenceSkin } from "./choice";
import { ExtendedTextReferenceSkin } from "./extended-text";
import { GapMatchReferenceSkin } from "./gap-match";
import { HottextReferenceSkin } from "./hottext";
import { InlineChoiceReferenceSkin } from "./inline-choice";
import { MatchReferenceSkin } from "./match";
import { MediaReferenceSkin } from "./media";
import { OrderReferenceSkin } from "./order";
import { SliderReferenceSkin } from "./slider";
import { TextEntryReferenceSkin } from "./text-entry";
import { UploadReferenceSkin } from "./upload";

export { textOf } from "./content";
export { AssociateReferenceSkin } from "./associate";
export { ChoiceReferenceSkin } from "./choice";
export { ExtendedTextReferenceSkin } from "./extended-text";
export { GapMatchReferenceSkin } from "./gap-match";
export { HottextReferenceSkin } from "./hottext";
export { InlineChoiceReferenceSkin } from "./inline-choice";
export { MatchReferenceSkin } from "./match";
export { MediaReferenceSkin } from "./media";
export { OrderReferenceSkin } from "./order";
export { SliderReferenceSkin } from "./slider";
export { TextEntryReferenceSkin } from "./text-entry";
export { UploadReferenceSkin } from "./upload";

export const referenceSkin: SkinRegistry = {
  associateInteraction: AssociateReferenceSkin,
  choiceInteraction: ChoiceReferenceSkin,
  extendedTextInteraction: ExtendedTextReferenceSkin,
  gapMatchInteraction: GapMatchReferenceSkin,
  hottextInteraction: HottextReferenceSkin,
  inlineChoiceInteraction: InlineChoiceReferenceSkin,
  matchInteraction: MatchReferenceSkin,
  mediaInteraction: MediaReferenceSkin,
  orderInteraction: OrderReferenceSkin,
  sliderInteraction: SliderReferenceSkin,
  textEntryInteraction: TextEntryReferenceSkin,
  uploadInteraction: UploadReferenceSkin,
};
