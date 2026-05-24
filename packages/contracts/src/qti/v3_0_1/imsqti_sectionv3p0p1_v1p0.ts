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
