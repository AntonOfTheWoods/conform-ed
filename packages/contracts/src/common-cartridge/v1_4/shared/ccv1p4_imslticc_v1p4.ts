import { z } from "zod";

import { NonEmptyStringSchema, XmlExtensionNodeListSchema, XmlForeignAttributesSchema, strictObject } from "../shared";
import { CurriculumStandardsMetadataSetSchema } from "./ccv1p4_imscsmd_v1p1";
import { LomCcLtiLinkSchema } from "./ccv1p4_lomccltilink_v1p0";
import { BasicLTILinkSchema } from "./imsbasiclti_v1p0p1";
import { PropertySetSchema } from "./imslticm_v1p0";
import { ToolLocatorSchema } from "./imslticp_v1p0";

export const CartridgeResourceRefSchema = strictObject({
  value: z.string(),
  identifierref: NonEmptyStringSchema,
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});

export const CartridgeBasicLtiMetadataSchema = strictObject({
  lom: LomCcLtiLinkSchema.optional(),
  curriculumStandardsMetadataSet: z.array(CurriculumStandardsMetadataSetSchema).optional(),
});

export const CartridgeBasicLTILinkSchema = BasicLTILinkSchema.extend({
  cartridge_bundle: CartridgeResourceRefSchema.optional(),
  cartridge_icon: CartridgeResourceRefSchema.optional(),
  metadata: CartridgeBasicLtiMetadataSchema.optional(),
});

export const CartridgeToolLocatorSchema = ToolLocatorSchema.extend({
  tool_settings: PropertySetSchema.optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const CartridgeBasicLTILinkDocumentSchema = strictObject({
  cartridge_basiclti_link: CartridgeBasicLTILinkSchema,
});

export const CartridgeToolLocatorDocumentSchema = strictObject({
  lti_tool_locator: CartridgeToolLocatorSchema,
});
