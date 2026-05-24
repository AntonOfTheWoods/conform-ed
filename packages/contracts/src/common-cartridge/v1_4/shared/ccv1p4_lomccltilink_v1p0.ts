import { strictObject } from "../shared";
import { LomCcLtiLinkProfileSchemas } from "../lom-internal";

export { LomCcLtiLinkProfileSchemas } from "../lom-internal";

export const LomCcLtiLinkSchema = LomCcLtiLinkProfileSchemas.LomSchema;

export const LomCcLtiLinkDocumentSchema = strictObject({
  lom: LomCcLtiLinkSchema,
});
