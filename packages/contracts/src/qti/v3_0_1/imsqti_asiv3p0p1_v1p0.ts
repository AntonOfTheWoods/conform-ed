import { z } from "zod";

export * from "./assessment-internal";
export * from "./variables-internal";
export * from "./processing-internal";

import { QtiAssessmentItemSchema, QtiAssessmentStimulusSchema, QtiAssessmentTestSchema } from "./assessment-internal";
import { QtiAssessmentItemDocumentSchema } from "./imsqti_itemv3p0p1_v1p0";
import { QtiOutcomeDeclarationDocumentSchema } from "./imsqti_outcomev3p0p1_v1p0";
import { QtiResponseProcessingDocumentSchema } from "./imsqti_responseprocessingv3p0p1_v1p0";
import { QtiAssessmentSectionDocumentSchema, QtiAssessmentSectionSchema } from "./imsqti_sectionv3p0p1_v1p0";
import { QtiAssessmentStimulusDocumentSchema } from "./imsqti_stimulusv3p0p1_v1p0";
import { QtiAssessmentTestDocumentSchema, QtiOutcomeProcessingDocumentSchema } from "./imsqti_testv3p0p1_v1p0";
import { strictObject } from "./shared";
import { QtiOutcomeDeclarationSchema } from "./variables-internal";

export const QtiAssessmentItemDocumentSchemaAlias = QtiAssessmentItemDocumentSchema;
export const QtiAssessmentSectionDocumentSchemaAlias = QtiAssessmentSectionDocumentSchema;
export const QtiAssessmentStimulusDocumentSchemaAlias = QtiAssessmentStimulusDocumentSchema;
export const QtiAssessmentTestDocumentSchemaAlias = QtiAssessmentTestDocumentSchema;

export const QtiAssessmentItemStandaloneDocumentSchema = strictObject({
  assessmentItem: QtiAssessmentItemSchema,
});

export const QtiAssessmentSectionStandaloneDocumentSchema = strictObject({
  assessmentSection: QtiAssessmentSectionSchema,
});

export const QtiAssessmentStimulusStandaloneDocumentSchema = strictObject({
  assessmentStimulus: QtiAssessmentStimulusSchema,
});

export const QtiAssessmentTestStandaloneDocumentSchema = strictObject({
  assessmentTest: QtiAssessmentTestSchema,
});

export const QtiOutcomeDeclarationStandaloneDocumentSchema = strictObject({
  outcomeDeclaration: QtiOutcomeDeclarationSchema,
});

export const QtiAsiProfileDocumentSchema = z.union([
  QtiAssessmentItemDocumentSchema,
  QtiAssessmentSectionDocumentSchema,
  QtiAssessmentStimulusDocumentSchema,
  QtiAssessmentTestDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiOutcomeProcessingDocumentSchema,
  QtiResponseProcessingDocumentSchema,
]);
// Inferred types from exported Zod validators.
export type QtiAssessmentItemStandaloneDocument = z.infer<typeof QtiAssessmentItemStandaloneDocumentSchema>;
export type QtiAssessmentSectionStandaloneDocument = z.infer<typeof QtiAssessmentSectionStandaloneDocumentSchema>;
export type QtiAssessmentStimulusStandaloneDocument = z.infer<typeof QtiAssessmentStimulusStandaloneDocumentSchema>;
export type QtiAssessmentTestStandaloneDocument = z.infer<typeof QtiAssessmentTestStandaloneDocumentSchema>;
export type QtiOutcomeDeclarationStandaloneDocument = z.infer<typeof QtiOutcomeDeclarationStandaloneDocumentSchema>;
export type QtiAsiProfileDocument = z.infer<typeof QtiAsiProfileDocumentSchema>;
