import type { z } from "zod";
export {
  QtiAssessmentStimulusRefSchema,
  QtiAssessmentStimulusSchema,
  QtiStimulusBodySchema,
} from "./assessment-internal";

import { QtiAssessmentStimulusSchema } from "./assessment-internal";
import { strictObject } from "./shared";

export const QtiAssessmentStimulusDocumentSchema = strictObject({
  assessmentStimulus: QtiAssessmentStimulusSchema,
});
// Inferred types from exported Zod validators.
export type QtiAssessmentStimulusDocument = z.infer<typeof QtiAssessmentStimulusDocumentSchema>;
