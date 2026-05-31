import type { z } from "zod";
import { strictObject } from "../shared";
import { LomManifestProfileSchemas } from "../lom-internal";

export { LomManifestProfileSchemas } from "../lom-internal";

export const ImsMdLooseLomSchema = LomManifestProfileSchemas.LomSchema;
export const ImsMdLooseLomDocumentSchema = strictObject({
  lom: ImsMdLooseLomSchema,
});
// Inferred types from exported Zod validators.
export type ImsMdLooseLom = z.infer<typeof ImsMdLooseLomSchema>;
export type ImsMdLooseLomDocument = z.infer<typeof ImsMdLooseLomDocumentSchema>;
