export { XmlExtensionNodeListSchema, XmlExtensionNodeSchema } from "./shared";

export * from "./ccv1p3_imscsmd_v1p0";
export * from "./ccv1p3_imsdt_v1p3";
export * from "./ccv1p3_imswl_v1p3";
export * from "./ccv1p3_lommanifest_v1p0";
export * from "./ccv1p3_lomresource_v1p0";
export * from "./ccv1p3_lomccltilink_v1p0";
export * from "./ccv1p3_imsccauth_v1p3";
export * from "./ccv1p3_imscp_v1p2_v1p0";
export * from "./ccv1p3_qtiasiv1p2p1_v1p0";

import { CurriculumStandardsMetadataSetDocumentSchema } from "./ccv1p3_imscsmd_v1p0";
import { DiscussionTopicDocumentSchema } from "./ccv1p3_imsdt_v1p3";
import { WebLinkDocumentSchema } from "./ccv1p3_imswl_v1p3";
import { CommonCartridgeAuthorizationsDocumentSchema } from "./ccv1p3_imsccauth_v1p3";
import {
  CommonCartridgeManifestProfileDocumentSchema,
  CommonCartridgeManifestRawDocumentSchema,
} from "./ccv1p3_imscp_v1p2_v1p0";
import { LomCcLtiLinkDocumentSchema } from "./ccv1p3_lomccltilink_v1p0";
import { LomManifestDocumentSchema } from "./ccv1p3_lommanifest_v1p0";
import { LomResourceDocumentSchema } from "./ccv1p3_lomresource_v1p0";
import {
  QtiQuestestinteropProfileDocumentSchema,
  QtiQuestestinteropRawDocumentSchema,
} from "./ccv1p3_qtiasiv1p2p1_v1p0";

export const CommonCartridgeDerivedZodTemplates = {
  curriculumStandardsMetadataSetDocument: CurriculumStandardsMetadataSetDocumentSchema,
  discussionTopicDocument: DiscussionTopicDocumentSchema,
  webLinkDocument: WebLinkDocumentSchema,
  lomManifestDocument: LomManifestDocumentSchema,
  lomResourceDocument: LomResourceDocumentSchema,
  lomCcLtiLinkDocument: LomCcLtiLinkDocumentSchema,
  commonCartridgeAuthorizationsDocument: CommonCartridgeAuthorizationsDocumentSchema,
  commonCartridgeManifestRawDocument: CommonCartridgeManifestRawDocumentSchema,
  commonCartridgeManifestProfileDocument: CommonCartridgeManifestProfileDocumentSchema,
  qtiQuestestinteropRawDocument: QtiQuestestinteropRawDocumentSchema,
  qtiQuestestinteropProfileDocument: QtiQuestestinteropProfileDocumentSchema,
} as const;
