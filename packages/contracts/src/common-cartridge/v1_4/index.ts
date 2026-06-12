export { XmlExtensionNodeListSchema, XmlExtensionNodeSchema } from "./shared";

export * from "./core/ccv1p4_imscp_v1p2_v1p0";
export * from "./core/ccv1p4_lommanifest_v1p0";
export * from "./core/ccv1p4_lomresource_v1p0";
export * from "./thin/ccv1p4_imscp_v1p2_v1p0";
export * from "./thin/ccv1p4_lommanifest_v1p0";
export * from "./thin/ccv1p4_lomresource_v1p0";
export * from "./k12/ccv1p4_imscp_v1p2_v1p0";
export * from "./k12/ccv1p4_imscp_v1p2_v1p0_thin";
export * from "./k12/ccv1p4_lommanifest_v1p0";
export * from "./k12/ccv1p4_lomresource_v1p0";
export * from "./shared/ccv1p4_imsccauth_v1p4";
export * from "./shared/ccv1p4_imscsmd_v1p1";
export * from "./shared/ccv1p4_imsdt_v1p4";
export * from "./shared/ccv1p4_imslticc_v1p4";
export * from "./shared/ccv1p4_imswl_v1p4";
export * from "./shared/ccv1p4_lomccltilink_v1p0";
export * from "./shared/ccv1p4_qtiasiv1p2p1_v1p0";
export * from "./shared/imsbasiclti_v1p0p1";
export * from "./shared/imslticm_v1p0";
export * from "./shared/imslticp_v1p0";
export * from "./shared/lineitem_v1p0";
export * from "./shared/resourcea11ymetadata-20210915";
export * from "./extension/cc_extresource_assignmentv1p0_v1p0";
export * from "./extension/ccv1p4_cpextensionv1p2_v1p0";
export * from "./extension/ims_openvideov1p0_v1p0";
export * from "./vdex/imsmd_loose_v1p3p2";
export * from "./vdex/imsvdex_v1p0";

import {
  CommonCartridgeManifestProfileDocumentSchema,
  CommonCartridgeManifestRawDocumentSchema,
} from "./core/ccv1p4_imscp_v1p2_v1p0";
import { LomManifestDocumentSchema } from "./core/ccv1p4_lommanifest_v1p0";
import { LomResourceDocumentSchema } from "./core/ccv1p4_lomresource_v1p0";
import { AssignmentDocumentSchema } from "./extension/cc_extresource_assignmentv1p0_v1p0";
import { CpxVariantDocumentSchema } from "./extension/ccv1p4_cpextensionv1p2_v1p0";
import { OpenVideoSessionDocumentSchema } from "./extension/ims_openvideov1p0_v1p0";
import {
  K12CommonCartridgeManifestProfileDocumentSchema,
  K12CommonCartridgeManifestRawDocumentSchema,
} from "./k12/ccv1p4_imscp_v1p2_v1p0";
import {
  K12ThinCommonCartridgeManifestProfileDocumentSchema,
  K12ThinCommonCartridgeManifestRawDocumentSchema,
} from "./k12/ccv1p4_imscp_v1p2_v1p0_thin";
import { K12LomManifestDocumentSchema } from "./k12/ccv1p4_lommanifest_v1p0";
import { K12LomResourceDocumentSchema } from "./k12/ccv1p4_lomresource_v1p0";
import { CommonCartridgeAuthorizationsDocumentSchema } from "./shared/ccv1p4_imsccauth_v1p4";
import { CurriculumStandardsMetadataSetDocumentSchema } from "./shared/ccv1p4_imscsmd_v1p1";
import { DiscussionTopicDocumentSchema } from "./shared/ccv1p4_imsdt_v1p4";
import { CartridgeBasicLTILinkDocumentSchema, CartridgeToolLocatorDocumentSchema } from "./shared/ccv1p4_imslticc_v1p4";
import { WebLinkDocumentSchema } from "./shared/ccv1p4_imswl_v1p4";
import { LomCcLtiLinkDocumentSchema } from "./shared/ccv1p4_lomccltilink_v1p0";
import {
  QtiQuestestinteropProfileDocumentSchema,
  QtiQuestestinteropRawDocumentSchema,
} from "./shared/ccv1p4_qtiasiv1p2p1_v1p0";
import { BasicLTILinkDocumentSchema } from "./shared/imsbasiclti_v1p0p1";
import { LineItemDocumentSchema } from "./shared/lineitem_v1p0";
import { ResourceAccessibilityMetadataDocumentSchema } from "./shared/resourcea11ymetadata-20210915";
import {
  ThinCommonCartridgeManifestProfileDocumentSchema,
  ThinCommonCartridgeManifestRawDocumentSchema,
} from "./thin/ccv1p4_imscp_v1p2_v1p0";
import { ThinLomManifestDocumentSchema } from "./thin/ccv1p4_lommanifest_v1p0";
import { ThinLomResourceDocumentSchema } from "./thin/ccv1p4_lomresource_v1p0";
import { ImsMdLooseLomDocumentSchema } from "./vdex/imsmd_loose_v1p3p2";
import { VdexDocumentSchema } from "./vdex/imsvdex_v1p0";

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
  thinLomManifestDocument: ThinLomManifestDocumentSchema,
  thinLomResourceDocument: ThinLomResourceDocumentSchema,
  thinCommonCartridgeManifestRawDocument: ThinCommonCartridgeManifestRawDocumentSchema,
  thinCommonCartridgeManifestProfileDocument: ThinCommonCartridgeManifestProfileDocumentSchema,
  k12LomManifestDocument: K12LomManifestDocumentSchema,
  k12LomResourceDocument: K12LomResourceDocumentSchema,
  k12CommonCartridgeManifestRawDocument: K12CommonCartridgeManifestRawDocumentSchema,
  k12CommonCartridgeManifestProfileDocument: K12CommonCartridgeManifestProfileDocumentSchema,
  k12ThinCommonCartridgeManifestRawDocument: K12ThinCommonCartridgeManifestRawDocumentSchema,
  k12ThinCommonCartridgeManifestProfileDocument: K12ThinCommonCartridgeManifestProfileDocumentSchema,
  qtiQuestestinteropRawDocument: QtiQuestestinteropRawDocumentSchema,
  qtiQuestestinteropProfileDocument: QtiQuestestinteropProfileDocumentSchema,
  cartridgeBasicLtiLinkDocument: CartridgeBasicLTILinkDocumentSchema,
  cartridgeToolLocatorDocument: CartridgeToolLocatorDocumentSchema,
  basicLtiLinkDocument: BasicLTILinkDocumentSchema,
  lineItemDocument: LineItemDocumentSchema,
  resourceAccessibilityMetadataDocument: ResourceAccessibilityMetadataDocumentSchema,
  commonCartridgeVariantDocument: CpxVariantDocumentSchema,
  assignmentDocument: AssignmentDocumentSchema,
  openVideoSessionDocument: OpenVideoSessionDocumentSchema,
  imsMdLooseDocument: ImsMdLooseLomDocumentSchema,
  vdexDocument: VdexDocumentSchema,
} as const;
