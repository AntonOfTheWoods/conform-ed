export { QtiOutcomeDeclarationRawSchema, QtiOutcomeDeclarationSchema } from "./variables-internal";

import { strictObject } from "./shared";
import { QtiOutcomeDeclarationSchema } from "./variables-internal";

export const QtiOutcomeDeclarationDocumentSchema = strictObject({
  outcomeDeclaration: QtiOutcomeDeclarationSchema,
});
