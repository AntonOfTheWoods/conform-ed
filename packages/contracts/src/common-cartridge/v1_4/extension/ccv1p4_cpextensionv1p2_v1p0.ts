import type { z } from "zod";

import { NonEmptyStringSchema, XmlExtensionNodeListSchema, strictObject } from "../shared";

export const CpxMetadataSchema = strictObject({
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const CpxVariantSchema = strictObject({
  metadata: CpxMetadataSchema,
  identifier: NonEmptyStringSchema,
  identifierref: NonEmptyStringSchema,
});

export const CpxVariantDocumentSchema = strictObject({
  variant: CpxVariantSchema,
});
// Inferred types from exported Zod validators.
export type CpxMetadata = z.infer<typeof CpxMetadataSchema>;
export type CpxVariant = z.infer<typeof CpxVariantSchema>;
export type CpxVariantDocument = z.infer<typeof CpxVariantDocumentSchema>;
