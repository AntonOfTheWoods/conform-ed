import { strictObject } from "../shared";
import { LomK12ResourceProfileSchemas } from "../lom-internal";

export { LomK12ResourceProfileSchemas } from "../lom-internal";

export const K12LomResourceSchema = LomK12ResourceProfileSchemas.LomSchema;

export const K12LomResourceDocumentSchema = strictObject({
  lom: K12LomResourceSchema,
});
