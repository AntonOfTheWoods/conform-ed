import { z } from "zod";

import { NonEmptyStringSchema, UriReferenceSchema, strictObject } from "../shared";
import { PlatformPropertySetSchema, PropertySetSchema } from "./imslticm_v1p0";
import { IconSchema, VendorSchema } from "./imslticp_v1p0";

export const BasicLTILinkSchema = strictObject({
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  custom: PropertySetSchema.optional(),
  extensions: z.array(PlatformPropertySetSchema).optional(),
  launch_url: UriReferenceSchema.optional(),
  secure_launch_url: UriReferenceSchema.optional(),
  icon: IconSchema.optional(),
  secure_icon: IconSchema.optional(),
  vendor: VendorSchema,
});

export const BasicLTILinkDocumentSchema = strictObject({
  basic_lti_link: BasicLTILinkSchema,
});
// Inferred types from exported Zod validators.
export type BasicLTILink = z.infer<typeof BasicLTILinkSchema>;
export type BasicLTILinkDocument = z.infer<typeof BasicLTILinkDocumentSchema>;
