import { z } from "zod";

import { NonEmptyStringSchema, UriReferenceSchema, XmlExtensionNodeListSchema, strictObject } from "./shared";

export const WebLinkUrlSchema = strictObject({
  href: UriReferenceSchema,
  target: z.string().optional(),
  windowFeatures: z.string().optional(),
});

export const WebLinkSchema = strictObject({
  title: NonEmptyStringSchema,
  url: WebLinkUrlSchema,
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const WebLinkDocumentSchema = strictObject({
  webLink: WebLinkSchema,
});
