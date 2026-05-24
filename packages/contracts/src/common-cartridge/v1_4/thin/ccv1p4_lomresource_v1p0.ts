import { strictObject } from "../shared";
import { LomThinResourceProfileSchemas } from "../lom-internal";

export { LomThinResourceProfileSchemas } from "../lom-internal";

export const ThinLomResourceSchema = LomThinResourceProfileSchemas.LomSchema;

export const ThinLomResourceDocumentSchema = strictObject({
  lom: ThinLomResourceSchema,
});
