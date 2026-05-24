import { z } from "zod";

import { NonEmptyStringSchema, XmlExtensionNodeListSchema, strictObject } from "../shared";

export const CommonCartridgeAuthorizationAccessSchema = z.enum(["cartridge", "resource"]);

export const CommonCartridgeAuthorizationSchema = strictObject({
  cartridgeId: NonEmptyStringSchema,
  webservice: z.string().optional(),
});

export const CommonCartridgeAuthorizationsSchema = strictObject({
  authorization: CommonCartridgeAuthorizationSchema,
  access: CommonCartridgeAuthorizationAccessSchema,
  import: z.boolean().optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const CommonCartridgeAuthorizationsDocumentSchema = strictObject({
  authorizations: CommonCartridgeAuthorizationsSchema,
});
