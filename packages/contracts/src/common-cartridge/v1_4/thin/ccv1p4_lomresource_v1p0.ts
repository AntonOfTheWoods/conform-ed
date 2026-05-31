import type { z } from "zod";
import { strictObject } from "../shared";
import { LomThinResourceProfileSchemas } from "../lom-internal";

export { LomThinResourceProfileSchemas } from "../lom-internal";

export const ThinLomResourceSchema = LomThinResourceProfileSchemas.LomSchema;

export const ThinLomResourceDocumentSchema = strictObject({
  lom: ThinLomResourceSchema,
});
// Inferred types from exported Zod validators.
export type ThinLomResource = z.infer<typeof ThinLomResourceSchema>;
export type ThinLomResourceDocument = z.infer<typeof ThinLomResourceDocumentSchema>;
