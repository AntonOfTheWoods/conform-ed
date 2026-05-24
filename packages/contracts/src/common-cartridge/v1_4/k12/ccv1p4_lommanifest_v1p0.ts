import { strictObject } from "../shared";
import { LomK12ManifestProfileSchemas } from "../lom-internal";

export { LomK12ManifestProfileSchemas } from "../lom-internal";

export const K12LomManifestSchema = LomK12ManifestProfileSchemas.LomSchema;

export const K12LomManifestDocumentSchema = strictObject({
  lom: K12LomManifestSchema,
});
