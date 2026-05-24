import { z } from "zod";

import { NonEmptyStringSchema, XmlForeignAttributesSchema, strictObject } from "../shared";

export const PropertySchema = strictObject({
  value: z.string(),
  name: NonEmptyStringSchema,
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});

export const PropertySetSchema = strictObject({
  property: z.array(PropertySchema).optional(),
});

export const PlatformPropertySetSchema = strictObject({
  property: z.array(PropertySchema).optional(),
  platform: NonEmptyStringSchema,
  foreignAttributes: XmlForeignAttributesSchema.optional(),
});
