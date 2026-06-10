// @conform-ed/qti-react — headless QTI 3 runtime (MIT). No Mantine; React + contracts only.

export const qtiReactPackageName = "@conform-ed/qti-react";

export {
  v0ContentModel,
  v0InteractionKinds,
  isAllowedFlowElement,
  isInteractionKind,
  sanitizeAttributes,
  type ContentModel,
  type V0InteractionKind,
} from "./content-model";

export { foldString, mapResponse, matchCorrect, scoreResponse } from "./response-processing";

export { createAttemptStore, type AttemptSnapshot, type AttemptStore } from "./store";

export {
  createQtiRuntime,
  defineInteraction,
  type AssessmentItemView,
  type AttemptController,
  type BodyNode,
  type InteractionDescriptor,
  type InteractionNode,
  type InteractionRenderProps,
  type InteractionSkin,
  type InteractionStatus,
  type ItemRendererProps,
  type OptionProps,
  type OptionStatus,
  type QtiRuntime,
  type QtiRuntimeConfig,
  type SkinRegistry,
  type XmlContentNode,
} from "./runtime";

export { choiceInteraction, inlineChoiceInteraction, qtiCoreInteractions, textEntryInteraction } from "./interactions";

export type {
  Cardinality,
  CorrectResponseView,
  MapEntryView,
  MappingView,
  ResponseDeclarationView,
  ResponseValue,
  ScoreResult,
} from "./types";
