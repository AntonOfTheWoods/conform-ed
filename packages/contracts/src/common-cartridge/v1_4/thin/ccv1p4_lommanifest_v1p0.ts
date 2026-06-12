import type { z } from "zod";

import { LomThinManifestProfileSchemas } from "../lom-internal";
import { strictObject } from "../shared";

export { LomThinManifestProfileSchemas } from "../lom-internal";

export const ThinLomManifestSchema = LomThinManifestProfileSchemas.LomSchema;

export const ThinLomManifestDocumentSchema = strictObject({
  lom: ThinLomManifestSchema,
});
// Inferred types from exported Zod validators.
export type ThinLomManifest = z.infer<typeof ThinLomManifestSchema>;
export type ThinLomManifestDocument = z.infer<typeof ThinLomManifestDocumentSchema>;
