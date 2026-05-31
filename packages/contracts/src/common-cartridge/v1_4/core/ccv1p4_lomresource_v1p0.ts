import type { z } from "zod";
import { strictObject } from "../shared";
import { LomResourceProfileSchemas } from "../lom-internal";

export { LomResourceProfileSchemas } from "../lom-internal";

export const LomResourceSchema = LomResourceProfileSchemas.LomSchema;

export const LomResourceDocumentSchema = strictObject({
  lom: LomResourceSchema,
});
// Inferred types from exported Zod validators.
export type LomResource = z.infer<typeof LomResourceSchema>;
export type LomResourceDocument = z.infer<typeof LomResourceDocumentSchema>;
