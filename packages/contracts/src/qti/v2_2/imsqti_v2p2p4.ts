import { z } from "zod";

import { qti22Schemas } from "./schemas";

export const {
  QtiAssessmentItemDocumentSchema,
  QtiAssessmentItemRawSchema,
  QtiAssessmentItemRefSchema,
  QtiAssessmentItemSchema,
  QtiAssessmentSectionDocumentSchema,
  QtiAssessmentSectionRawSchema,
  QtiAssessmentSectionRefSchema,
  QtiAssessmentSectionSchema,
  QtiAssessmentStimulusDocumentSchema,
  QtiAssessmentStimulusRefSchema,
  QtiAssessmentStimulusSchema,
  QtiAssessmentTestDocumentSchema,
  QtiAssessmentTestRawSchema,
  QtiAssessmentTestSchema,
  QtiAssociateInteractionSchema,
  QtiBranchRuleSchema,
  QtiChoiceInteractionSchema,
  QtiExtendedTextInteractionSchema,
  QtiGapMatchInteractionSchema,
  QtiHotspotInteractionSchema,
  QtiHottextInteractionSchema,
  QtiInlineChoiceInteractionSchema,
  QtiItemBodyDocumentSchema,
  QtiItemBodySchema,
  QtiItemSessionControlSchema,
  QtiMatchInteractionSchema,
  QtiMediaInteractionSchema,
  QtiModalFeedbackDocumentSchema,
  QtiModalFeedbackSchema,
  QtiOrderingSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiOutcomeDeclarationRawSchema,
  QtiOutcomeDeclarationSchema,
  QtiOutcomeProcessingDocumentSchema,
  QtiOutcomeProcessingSchema,
  QtiResponseDeclarationDocumentSchema,
  QtiResponseDeclarationRawSchema,
  QtiResponseDeclarationSchema,
  QtiResponseProcessingDocumentSchema,
  QtiResponseProcessingSchema,
  QtiRubricBlockSchema,
  QtiSelectionSchema,
  QtiStimulusBodySchema,
  QtiTemplateDeclarationDocumentSchema,
  QtiTemplateDeclarationRawSchema,
  QtiTemplateDeclarationSchema,
  QtiTemplateProcessingDocumentSchema,
  QtiTemplateProcessingSchema,
  QtiTestFeedbackSchema,
  QtiTestPartSchema,
  QtiTextEntryInteractionSchema,
  QtiTimeLimitsSchema,
  QtiUploadInteractionSchema,
} = qti22Schemas;

export const QtiItemProfileDocumentSchema = z.union([
  QtiAssessmentItemDocumentSchema,
  QtiAssessmentStimulusDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiResponseProcessingDocumentSchema,
]);

export const QtiTestProfileDocumentSchema = z.union([
  QtiAssessmentTestDocumentSchema,
  QtiAssessmentSectionDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiOutcomeProcessingDocumentSchema,
]);
// Inferred types from exported Zod validators.
export type QtiItemProfileDocument = z.infer<typeof QtiItemProfileDocumentSchema>;
export type QtiTestProfileDocument = z.infer<typeof QtiTestProfileDocumentSchema>;
