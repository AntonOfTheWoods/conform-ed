import { strictObject } from "../shared";
import { LomManifestProfileSchemas } from "../lom-internal";

export { LomManifestProfileSchemas } from "../lom-internal";

export const LomManifestSchema = LomManifestProfileSchemas.LomSchema;

export const LomManifestDocumentSchema = strictObject({
  lom: LomManifestSchema,
});
