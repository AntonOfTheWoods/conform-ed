import type { z } from "zod";
export {
  QtiResponseConditionSchema,
  QtiResponseElseSchema,
  QtiResponseIfSchema,
  QtiResponseProcessingFragmentSchema,
  QtiResponseProcessingSchema,
} from "./processing-internal";

import { QtiResponseProcessingSchema } from "./processing-internal";
import { strictObject } from "./shared";

export const QtiResponseProcessingDocumentSchema = strictObject({
  responseProcessing: QtiResponseProcessingSchema,
});
// Inferred types from exported Zod validators.
export type QtiResponseProcessingDocument = z.infer<typeof QtiResponseProcessingDocumentSchema>;
