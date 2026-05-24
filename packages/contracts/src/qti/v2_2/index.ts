export {
  XmlExtensionNodeListSchema as QtiXmlExtensionNodeListSchema,
  XmlExtensionNodeSchema as QtiXmlExtensionNodeSchema,
} from "./shared";

export * from "./apipv1p0_qtiextv2p2_v1p0p1";
export * from "./imsqti_metadata_v2p2";
export * from "./imsqti_result_v2p2";
export * from "./imsqti_usagedata_v2p2";
export * from "./imsqti_v2p2p4";
export * from "./imsqtiv2p2p4_html5_v1p0";
export * from "./qtiv2p2_csm_v2p2";
export * from "./qtiv2p2_imscpv1p2_v1p0";

import { QtiApipAccessibilityDocumentSchema } from "./apipv1p0_qtiextv2p2_v1p0p1";
import { QtiMetadataDocumentSchema } from "./imsqti_metadata_v2p2";
import { QtiAssessmentResultDocumentSchema } from "./imsqti_result_v2p2";
import { QtiUsageDataDocumentSchema } from "./imsqti_usagedata_v2p2";
import {
  QtiAssessmentItemDocumentSchema,
  QtiAssessmentSectionDocumentSchema,
  QtiAssessmentStimulusDocumentSchema,
  QtiAssessmentTestDocumentSchema,
  QtiItemBodyDocumentSchema,
  QtiItemProfileDocumentSchema,
  QtiModalFeedbackDocumentSchema,
  QtiOutcomeDeclarationDocumentSchema,
  QtiOutcomeProcessingDocumentSchema,
  QtiResponseDeclarationDocumentSchema,
  QtiResponseProcessingDocumentSchema,
  QtiTemplateDeclarationDocumentSchema,
  QtiTemplateProcessingDocumentSchema,
  QtiTestProfileDocumentSchema,
} from "./imsqti_v2p2p4";
import { QtiCurriculumStandardsMetadataSetDocumentSchema } from "./qtiv2p2_csm_v2p2";
import { QtiManifestDocumentSchema } from "./qtiv2p2_imscpv1p2_v1p0";

export const Qti22DerivedZodTemplates = {
  qtiApipAccessibilityDocument: QtiApipAccessibilityDocumentSchema,
  qtiMetadataDocument: QtiMetadataDocumentSchema,
  qtiAssessmentResultDocument: QtiAssessmentResultDocumentSchema,
  qtiUsageDataDocument: QtiUsageDataDocumentSchema,
  qtiManifestDocument: QtiManifestDocumentSchema,
  qtiCurriculumStandardsMetadataSetDocument: QtiCurriculumStandardsMetadataSetDocumentSchema,
  qtiAssessmentItemDocument: QtiAssessmentItemDocumentSchema,
  qtiAssessmentSectionDocument: QtiAssessmentSectionDocumentSchema,
  qtiAssessmentStimulusDocument: QtiAssessmentStimulusDocumentSchema,
  qtiAssessmentTestDocument: QtiAssessmentTestDocumentSchema,
  qtiItemBodyDocument: QtiItemBodyDocumentSchema,
  qtiModalFeedbackDocument: QtiModalFeedbackDocumentSchema,
  qtiResponseDeclarationDocument: QtiResponseDeclarationDocumentSchema,
  qtiOutcomeDeclarationDocument: QtiOutcomeDeclarationDocumentSchema,
  qtiTemplateDeclarationDocument: QtiTemplateDeclarationDocumentSchema,
  qtiResponseProcessingDocument: QtiResponseProcessingDocumentSchema,
  qtiOutcomeProcessingDocument: QtiOutcomeProcessingDocumentSchema,
  qtiTemplateProcessingDocument: QtiTemplateProcessingDocumentSchema,
  qtiItemProfileDocument: QtiItemProfileDocumentSchema,
  qtiTestProfileDocument: QtiTestProfileDocumentSchema,
} as const;
