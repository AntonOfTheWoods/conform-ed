import { z } from "zod";

import { NonEmptyStringSchema, UriReferenceSchema, XmlForeignAttributesSchema, strictObject } from "../shared";

export const AgsExtensionPropertyJsonTypeSchema = z.enum(["string", "number", "boolean", "object", "array", "other"]);

export const AgsExtensionPropertySchema = strictObject({
  value: z.string(),
  name: NonEmptyStringSchema,
  jsonType: AgsExtensionPropertyJsonTypeSchema.optional(),
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});

export const AgsExtensionsSchema = strictObject({
  property: z.array(AgsExtensionPropertySchema).optional(),
  claim: UriReferenceSchema,
});

export const LineItemSchema = strictObject({
  scoreMaximum: z.number(),
  label: z.string(),
  resourceId: z.string().optional(),
  tag: z.string().optional(),
  extensions: z.array(AgsExtensionsSchema).optional(),
});

export const LineItemDocumentSchema = strictObject({
  lineItem: LineItemSchema,
});
// Inferred types from exported Zod validators.
export type AgsExtensionPropertyJsonType = z.infer<typeof AgsExtensionPropertyJsonTypeSchema>;
export type AgsExtensionProperty = z.infer<typeof AgsExtensionPropertySchema>;
export type AgsExtensions = z.infer<typeof AgsExtensionsSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type LineItemDocument = z.infer<typeof LineItemDocumentSchema>;
