import { z } from "zod";

export {
  QtiAssessmentItemRawSchema,
  QtiAssessmentItemRefSchema,
  QtiAssessmentItemSchema,
  QtiAssessmentStimulusRefSchema,
  QtiChoiceInteractionSchema,
  QtiCompanionMaterialsInfoSchema,
  QtiExtendedTextInteractionSchema,
  QtiGapMatchInteractionSchema,
  QtiHotTextInteractionSchema,
  QtiHotspotInteractionSchema,
  QtiInlineChoiceInteractionSchema,
  QtiItemBodySchema,
  QtiMatchInteractionSchema,
  QtiMediaInteractionSchema,
  QtiModalFeedbackSchema,
  QtiOrderInteractionSchema,
  QtiTextEntryInteractionSchema,
  QtiUploadInteractionSchema,
} from "./assessment-internal";
export {
  QtiOutcomeDeclarationRawSchema,
  QtiOutcomeDeclarationSchema,
  QtiResponseDeclarationRawSchema,
  QtiResponseDeclarationSchema,
  QtiTemplateDeclarationSchema,
} from "./variables-internal";
export {
  QtiResponseConditionSchema,
  QtiResponseElseSchema,
  QtiResponseIfSchema,
  QtiResponseProcessingFragmentSchema,
  QtiResponseProcessingSchema,
  QtiTemplateConditionSchema,
  QtiTemplateConstraintSchema,
  QtiTemplateDefaultSchema,
  QtiTemplateElseSchema,
  QtiTemplateIfSchema,
  QtiTemplateProcessingSchema,
} from "./processing-internal";

import { QtiAssessmentItemSchema } from "./assessment-internal";
import { strictObject } from "./shared";
import { QtiOutcomeDeclarationDocumentSchema } from "./imsqti_outcomev3p0p1_v1p0";
import { QtiResponseProcessingDocumentSchema } from "./imsqti_responseprocessingv3p0p1_v1p0";

export const QtiAssessmentItemDocumentSchema = strictObject({
  assessmentItem: QtiAssessmentItemSchema,
});

export const QtiItemProfileDocumentSchema = z.union([
  QtiAssessmentItemDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiResponseProcessingDocumentSchema,
]);
