/**
 * Headless (React-free) surface of @conform-ed/qti-react: the normalize → view adapters,
 * the capability gate, and the **scoring engine** (Response Processing interpreter, the
 * standard per-response scoring templates, the item-score aggregator, and the test-level
 * outcome-processing controller). Importable on a server (e.g. a QTI ingest pipeline or an
 * authoritative grade finalize) without pulling React. Exposed at
 * `@conform-ed/qti-react/headless`; everything here is also re-exported from the package
 * root for React consumers.
 *
 * Keep this entry free of React-coupled imports — every module re-exported here
 * (./normalized-item, ./item-capability, ./response-processing, ./rp, ./item-score,
 * ./store, ./test, ./response-validity) is verified framework-light.
 */

export {
  assessmentItemViewFromNormalized,
  assessmentTestViewFromNormalized,
  stimulusContentFromNormalized,
} from "./normalized-item";
export { referenceInteractionKinds, reportItemCapability, type ItemCapabilityOptions } from "./item-capability";

// The scoring engine, headless. Running these server-side re-derives the grade of record
// from the learner's raw responses + the (server-held) answer keys — see emergent ADR-0019.
export { foldString, mapResponse, matchCorrect, mapResponsePoint, scoreResponse } from "./response-processing";
export { effectiveItemScore, type EffectiveItemScore } from "./item-score";
export {
  applyCorrectResponseOverrides,
  collectRpIssues,
  collectTemplateIssues,
  executeResponseProcessing,
  executeTemplateProcessing,
  mulberry32,
  resolveTemplate,
} from "./rp";
export type {
  CustomOperatorImplementation,
  OutcomeDeclarationView,
  OutcomeValue,
  ResponseNormalization,
  ResponseProcessingContext,
  ResponseProcessingResult,
  ResponseProcessingView,
  TemplateDeclarationView,
} from "./rp";
export { createAttemptStore, type AttemptSnapshot, type AttemptStore, type AttemptStoreOptions } from "./store";
export { createTestController, type TestController, type TestSessionState } from "./test";

export type { CapabilityIssue, CapabilityIssueType, CapabilityReport } from "./capability";
export type {
  AssessmentItemView,
  AssessmentStimulusRefView,
  BodyNode,
  InteractionNode,
  StimulusContentView,
  XmlContentNode,
} from "./runtime";
export type { AssessmentTestView } from "./test";
export type { Cardinality, ResponseDeclarationView, ResponseValue, ScoreResult } from "./types";
