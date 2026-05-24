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
