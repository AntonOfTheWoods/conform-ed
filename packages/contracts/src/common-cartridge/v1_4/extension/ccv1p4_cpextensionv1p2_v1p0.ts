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
