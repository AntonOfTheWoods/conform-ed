import { z } from "zod";

export {
  QtiAdaptiveSelectionSchema,
  QtiAssessmentItemRefSchema,
  QtiAssessmentSectionRawSchema,
  QtiAssessmentSectionRefSchema,
  QtiAssessmentSectionSchema,
  QtiAssessmentTestRawSchema,
  QtiAssessmentTestSchema,
  QtiOrderingSchema,
  QtiSelectionSchema,
  QtiTestFeedbackSchema,
  QtiTestPartSchema,
  QtiTestRubricBlockSchema,
} from "./assessment-internal";
export { QtiOutcomeDeclarationRawSchema, QtiOutcomeDeclarationSchema } from "./variables-internal";
export {
  QtiOutcomeConditionSchema,
  QtiOutcomeElseSchema,
  QtiOutcomeIfSchema,
  QtiOutcomeProcessingFragmentSchema,
  QtiOutcomeProcessingSchema,
} from "./processing-internal";

import { QtiAssessmentTestSchema } from "./assessment-internal";
import { QtiOutcomeDeclarationDocumentSchema } from "./imsqti_outcomev3p0p1_v1p0";
import { QtiAssessmentSectionDocumentSchema } from "./imsqti_sectionv3p0p1_v1p0";
import { QtiOutcomeProcessingSchema } from "./processing-internal";
import { strictObject } from "./shared";

export const QtiAssessmentTestDocumentSchema = strictObject({
  assessmentTest: QtiAssessmentTestSchema,
});

export const QtiOutcomeProcessingDocumentSchema = strictObject({
  outcomeProcessing: QtiOutcomeProcessingSchema,
});

export const QtiTestProfileDocumentSchema = z.union([
  QtiAssessmentTestDocumentSchema,
  QtiAssessmentSectionDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiOutcomeProcessingDocumentSchema,
]);
// Inferred types from exported Zod validators.
export type QtiAssessmentTestDocument = z.infer<typeof QtiAssessmentTestDocumentSchema>;
export type QtiOutcomeProcessingDocument = z.infer<typeof QtiOutcomeProcessingDocumentSchema>;
export type QtiTestProfileDocument = z.infer<typeof QtiTestProfileDocumentSchema>;
