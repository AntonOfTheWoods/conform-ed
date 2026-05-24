import { strictObject } from "../shared";
import { LomManifestProfileSchemas } from "../lom-internal";

export { LomManifestProfileSchemas } from "../lom-internal";

export const ImsMdLooseLomSchema = LomManifestProfileSchemas.LomSchema;
export const ImsMdLooseLomDocumentSchema = strictObject({
  lom: ImsMdLooseLomSchema,
});
