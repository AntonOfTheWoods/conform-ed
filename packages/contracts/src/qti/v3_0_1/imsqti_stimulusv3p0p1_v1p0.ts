import type { z } from "zod";
export {
  QtiAssessmentStimulusRefSchema,
  QtiAssessmentStimulusSchema,
  QtiStimulusBodySchema,
} from "./assessment-internal";

import { strictObject } from "./shared";
import { QtiAssessmentStimulusSchema } from "./assessment-internal";

export const QtiAssessmentStimulusDocumentSchema = strictObject({
  assessmentStimulus: QtiAssessmentStimulusSchema,
});
// Inferred types from exported Zod validators.
export type QtiAssessmentStimulusDocument = z.infer<typeof QtiAssessmentStimulusDocumentSchema>;
