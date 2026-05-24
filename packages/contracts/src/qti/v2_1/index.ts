export {
  XmlExtensionNodeListSchema as QtiXmlExtensionNodeListSchema,
  XmlExtensionNodeSchema as QtiXmlExtensionNodeSchema,
} from "./shared";

export * from "./apipv1p0_qtiextv2p1_v1p0";
export * from "./imsqti_metadata_v2p1";
export * from "./imsqti_result_v2p1";
export * from "./imsqti_usagedata_v2p1";
export * from "./imsqti_v2p1p2";
export * from "./qtiv2p1_imscpv1p2_v1p0";

import { QtiApipAccessibilityDocumentSchema } from "./apipv1p0_qtiextv2p1_v1p0";
import { QtiMetadataDocumentSchema } from "./imsqti_metadata_v2p1";
import { QtiAssessmentResultDocumentSchema } from "./imsqti_result_v2p1";
import { QtiUsageDataDocumentSchema } from "./imsqti_usagedata_v2p1";
import {
  QtiAssessmentItemDocumentSchema,
  QtiAssessmentSectionDocumentSchema,
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
} from "./imsqti_v2p1p2";
import { QtiManifestDocumentSchema } from "./qtiv2p1_imscpv1p2_v1p0";

export const Qti21DerivedZodTemplates = {
  qtiApipAccessibilityDocument: QtiApipAccessibilityDocumentSchema,
  qtiMetadataDocument: QtiMetadataDocumentSchema,
  qtiAssessmentResultDocument: QtiAssessmentResultDocumentSchema,
  qtiUsageDataDocument: QtiUsageDataDocumentSchema,
  qtiManifestDocument: QtiManifestDocumentSchema,
  qtiAssessmentItemDocument: QtiAssessmentItemDocumentSchema,
  qtiAssessmentSectionDocument: QtiAssessmentSectionDocumentSchema,
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
