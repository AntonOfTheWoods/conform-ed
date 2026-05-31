import type { z } from "zod";
import { strictObject } from "../shared";
import { LomThinManifestProfileSchemas } from "../lom-internal";

export { LomThinManifestProfileSchemas } from "../lom-internal";

export const ThinLomManifestSchema = LomThinManifestProfileSchemas.LomSchema;

export const ThinLomManifestDocumentSchema = strictObject({
  lom: ThinLomManifestSchema,
});
// Inferred types from exported Zod validators.
export type ThinLomManifest = z.infer<typeof ThinLomManifestSchema>;
export type ThinLomManifestDocument = z.infer<typeof ThinLomManifestDocumentSchema>;
