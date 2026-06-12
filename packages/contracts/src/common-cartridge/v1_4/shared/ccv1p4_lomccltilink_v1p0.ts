import type { z } from "zod";

import { LomCcLtiLinkProfileSchemas } from "../lom-internal";
import { strictObject } from "../shared";

export { LomCcLtiLinkProfileSchemas } from "../lom-internal";

export const LomCcLtiLinkSchema = LomCcLtiLinkProfileSchemas.LomSchema;

export const LomCcLtiLinkDocumentSchema = strictObject({
  lom: LomCcLtiLinkSchema,
});
// Inferred types from exported Zod validators.
export type LomCcLtiLink = z.infer<typeof LomCcLtiLinkSchema>;
export type LomCcLtiLinkDocument = z.infer<typeof LomCcLtiLinkDocumentSchema>;
