import type { z } from "zod";
import { strictObject } from "../shared";
import { LomK12ManifestProfileSchemas } from "../lom-internal";

export { LomK12ManifestProfileSchemas } from "../lom-internal";

export const K12LomManifestSchema = LomK12ManifestProfileSchemas.LomSchema;

export const K12LomManifestDocumentSchema = strictObject({
  lom: K12LomManifestSchema,
});
// Inferred types from exported Zod validators.
export type K12LomManifest = z.infer<typeof K12LomManifestSchema>;
export type K12LomManifestDocument = z.infer<typeof K12LomManifestDocumentSchema>;
