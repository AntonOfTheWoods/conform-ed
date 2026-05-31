import type { z } from "zod";
export {
  QtiResponseConditionSchema,
  QtiResponseElseSchema,
  QtiResponseIfSchema,
  QtiResponseProcessingFragmentSchema,
  QtiResponseProcessingSchema,
} from "./processing-internal";

import { strictObject } from "./shared";
import { QtiResponseProcessingSchema } from "./processing-internal";

export const QtiResponseProcessingDocumentSchema = strictObject({
  responseProcessing: QtiResponseProcessingSchema,
});
// Inferred types from exported Zod validators.
export type QtiResponseProcessingDocument = z.infer<typeof QtiResponseProcessingDocumentSchema>;
