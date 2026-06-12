import type { z } from "zod";

import { LomK12ResourceProfileSchemas } from "../lom-internal";
import { strictObject } from "../shared";

export { LomK12ResourceProfileSchemas } from "../lom-internal";

export const K12LomResourceSchema = LomK12ResourceProfileSchemas.LomSchema;

export const K12LomResourceDocumentSchema = strictObject({
  lom: K12LomResourceSchema,
});
// Inferred types from exported Zod validators.
export type K12LomResource = z.infer<typeof K12LomResourceSchema>;
export type K12LomResourceDocument = z.infer<typeof K12LomResourceDocumentSchema>;
