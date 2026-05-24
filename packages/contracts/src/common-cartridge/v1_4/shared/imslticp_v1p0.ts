import { z } from "zod";

import {
  NonEmptyStringSchema,
  UriReferenceSchema,
  XmlExtensionNodeListSchema,
  XmlForeignAttributesSchema,
  strictObject,
} from "../shared";

export const LocalizedStringSchema = strictObject({
  value: z.string(),
  key: NonEmptyStringSchema.optional(),
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});

export const ContactSchema = strictObject({
  email: NonEmptyStringSchema,
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const VendorSchema = strictObject({
  code: NonEmptyStringSchema,
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  url: UriReferenceSchema.optional(),
  contact: ContactSchema.optional(),
});

export const ProductInfoSchema = strictObject({
  code: NonEmptyStringSchema,
  name: LocalizedStringSchema,
  version: NonEmptyStringSchema,
  description: LocalizedStringSchema.optional(),
  technical_description: LocalizedStringSchema.optional(),
});

export const ToolLocatorSchema = strictObject({
  vendor: VendorSchema,
  tool_info: ProductInfoSchema,
  deployment_url: UriReferenceSchema,
});

export const IconSchema = strictObject({
  value: UriReferenceSchema,
  key: NonEmptyStringSchema.optional(),
  platform: NonEmptyStringSchema.optional(),
  style: NonEmptyStringSchema.optional(),
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});
