import { strictObject } from "../shared";
import { LomThinManifestProfileSchemas } from "../lom-internal";

export { LomThinManifestProfileSchemas } from "../lom-internal";

export const ThinLomManifestSchema = LomThinManifestProfileSchemas.LomSchema;

export const ThinLomManifestDocumentSchema = strictObject({
  lom: ThinLomManifestSchema,
});
