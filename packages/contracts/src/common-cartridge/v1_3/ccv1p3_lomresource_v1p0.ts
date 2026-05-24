import { strictObject } from "./shared";
import { LomResourceProfileSchemas } from "./lom-internal";

export { LomResourceProfileSchemas } from "./lom-internal";

export const LomResourceSchema = LomResourceProfileSchemas.LomSchema;

export const LomResourceDocumentSchema = strictObject({
  lom: LomResourceSchema,
});
