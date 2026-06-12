import type { z } from "zod";

import { LomThinResourceProfileSchemas } from "../lom-internal";
import { strictObject } from "../shared";

export { LomThinResourceProfileSchemas } from "../lom-internal";

export const ThinLomResourceSchema = LomThinResourceProfileSchemas.LomSchema;

export const ThinLomResourceDocumentSchema = strictObject({
  lom: ThinLomResourceSchema,
});
// Inferred types from exported Zod validators.
export type ThinLomResource = z.infer<typeof ThinLomResourceSchema>;
export type ThinLomResourceDocument = z.infer<typeof ThinLomResourceDocumentSchema>;
