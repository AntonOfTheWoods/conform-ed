import type { z } from "zod";
export { QtiOutcomeDeclarationRawSchema, QtiOutcomeDeclarationSchema } from "./variables-internal";

import { strictObject } from "./shared";
import { QtiOutcomeDeclarationSchema } from "./variables-internal";

export const QtiOutcomeDeclarationDocumentSchema = strictObject({
  outcomeDeclaration: QtiOutcomeDeclarationSchema,
});
// Inferred types from exported Zod validators.
export type QtiOutcomeDeclarationDocument = z.infer<typeof QtiOutcomeDeclarationDocumentSchema>;
