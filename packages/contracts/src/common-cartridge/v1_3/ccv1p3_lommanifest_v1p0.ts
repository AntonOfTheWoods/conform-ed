import type { z } from "zod";

import { LomManifestProfileSchemas } from "./lom-internal";
import { strictObject } from "./shared";

export { LomManifestProfileSchemas } from "./lom-internal";

export const LomManifestSchema = LomManifestProfileSchemas.LomSchema;

export const LomManifestDocumentSchema = strictObject({
  lom: LomManifestSchema,
});
// Inferred types from exported Zod validators.
export type LomManifest = z.infer<typeof LomManifestSchema>;
export type LomManifestDocument = z.infer<typeof LomManifestDocumentSchema>;
