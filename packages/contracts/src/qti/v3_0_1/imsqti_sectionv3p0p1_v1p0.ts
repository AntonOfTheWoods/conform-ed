import type { z } from "zod";
export {
  QtiAssessmentSectionRawSchema,
  QtiAssessmentSectionRefSchema,
  QtiAssessmentSectionSchema,
} from "./assessment-internal";

import { strictObject } from "./shared";
import { QtiAssessmentSectionSchema } from "./assessment-internal";

export const QtiAssessmentSectionDocumentSchema = strictObject({
  assessmentSection: QtiAssessmentSectionSchema,
});
// Inferred types from exported Zod validators.
export type QtiAssessmentSectionDocument = z.infer<typeof QtiAssessmentSectionDocumentSchema>;
