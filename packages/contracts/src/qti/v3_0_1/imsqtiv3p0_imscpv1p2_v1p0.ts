import { z } from "zod";

import { QtiMetadataSchema } from "./imsqti_metadatav3p0_v1p0";
import { strictObject } from "./shared";

/**
 * The QTI 3.0 content-package manifest (imsqtiv3p0_imscpv1p2_v1p0.xsd, namespace
 * …/qti/qtiv3p0/imscp_v1p1). Resource types are an open vocabulary by design — the
 * official corpus itself mixes the imsqti_*_xmlv3p0 tokens with mime-style values
 * (qtiusagedata/xml, resourcemetadata/xml) and LTI link types (imslti_xmlv1p1).
 */

const NonEmptyStringSchema = z.string().min(1);

export const QtiV3ManifestResourceMetadataSchema = strictObject({
  qtiMetadata: QtiMetadataSchema.optional(),
  /** IEEE LOM subtree, preserved structurally (its own specification). */
  lom: z.unknown().optional(),
});

export const QtiV3ManifestMetadataSchema = strictObject({
  schema: NonEmptyStringSchema,
  schemaVersion: NonEmptyStringSchema,
  qtiMetadata: QtiMetadataSchema.optional(),
  lom: z.unknown().optional(),
});

export const QtiV3ManifestFileSchema = strictObject({
  href: NonEmptyStringSchema,
  metadata: QtiV3ManifestResourceMetadataSchema.optional(),
});

export const QtiV3ManifestDependencySchema = strictObject({
  identifierRef: NonEmptyStringSchema,
});

export const QtiV3ManifestResourceSchema = strictObject({
  identifier: NonEmptyStringSchema,
  type: NonEmptyStringSchema,
  href: NonEmptyStringSchema.optional(),
  metadata: QtiV3ManifestResourceMetadataSchema.optional(),
  files: z.array(QtiV3ManifestFileSchema).optional(),
  dependencies: z.array(QtiV3ManifestDependencySchema).optional(),
});

export const QtiV3ManifestSchema = strictObject({
  identifier: NonEmptyStringSchema,
  metadata: QtiV3ManifestMetadataSchema,
  organizations: strictObject({}),
  resources: z.array(QtiV3ManifestResourceSchema).default([]),
}).superRefine((value, context) => {
  const seen = new Set<string>();

  for (const [index, resource] of value.resources.entries()) {
    if (seen.has(resource.identifier)) {
      context.addIssue({
        code: "custom",
        path: ["resources", index, "identifier"],
        message: `Duplicate manifest resource identifier: ${resource.identifier}`,
      });
    }
    seen.add(resource.identifier);
  }
});

export const QtiManifestDocumentSchema = strictObject({
  manifest: QtiV3ManifestSchema,
});
// Inferred types from exported Zod validators.
export type QtiV3ManifestResourceMetadata = z.infer<typeof QtiV3ManifestResourceMetadataSchema>;
export type QtiV3ManifestMetadata = z.infer<typeof QtiV3ManifestMetadataSchema>;
export type QtiV3ManifestFile = z.infer<typeof QtiV3ManifestFileSchema>;
export type QtiV3ManifestDependency = z.infer<typeof QtiV3ManifestDependencySchema>;
export type QtiV3ManifestResource = z.infer<typeof QtiV3ManifestResourceSchema>;
export type QtiV3Manifest = z.infer<typeof QtiV3ManifestSchema>;
export type QtiManifestDocument = z.infer<typeof QtiManifestDocumentSchema>;
