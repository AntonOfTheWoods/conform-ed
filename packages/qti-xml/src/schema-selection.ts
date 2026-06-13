import * as QtiV2_2 from "@conform-ed/contracts/qti/v2_2";
import * as QtiV3_0_1 from "@conform-ed/contracts/qti/v3_0_1";

import type { QtiRootDetection, QtiSchemaSelectionKey, QtiVersion } from "./types";

type SafeParseSchema = {
  safeParse(input: unknown): unknown;
};

export interface QtiSchemaSelection {
  version: QtiVersion;
  key: QtiSchemaSelectionKey;
  schema: SafeParseSchema;
}

const registry: Record<string, SafeParseSchema> = {
  "2.2:qtiAssessmentItemDocument": QtiV2_2.QtiAssessmentItemDocumentSchema as SafeParseSchema,
  "2.2:qtiAssessmentResultDocument": QtiV2_2.QtiAssessmentResultDocumentSchema as SafeParseSchema,
  "2.2:qtiAssessmentSectionDocument": QtiV2_2.QtiAssessmentSectionDocumentSchema as SafeParseSchema,
  "2.2:qtiAssessmentStimulusDocument": QtiV2_2.QtiAssessmentStimulusDocumentSchema as SafeParseSchema,
  "2.2:qtiAssessmentTestDocument": QtiV2_2.QtiAssessmentTestDocumentSchema as SafeParseSchema,
  "2.2:qtiManifestDocument": QtiV2_2.QtiManifestDocumentSchema as SafeParseSchema,
  "2.2:qtiMetadataDocument": QtiV2_2.QtiMetadataDocumentSchema as SafeParseSchema,
  "2.2:qtiUsageDataDocument": QtiV2_2.QtiUsageDataDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAccessForAllPnpDocument": QtiV3_0_1.QtiAccessForAllPnpDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAccessForAllPnpRecordsDocument": QtiV3_0_1.QtiAccessForAllPnpRecordsDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAssessmentItemDocument": QtiV3_0_1.QtiAssessmentItemDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAssessmentResultDocument": QtiV3_0_1.QtiAssessmentResultDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAssessmentSectionDocument": QtiV3_0_1.QtiAssessmentSectionDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAssessmentStimulusDocument": QtiV3_0_1.QtiAssessmentStimulusDocumentSchema as SafeParseSchema,
  "3.0.1:qtiAssessmentTestDocument": QtiV3_0_1.QtiAssessmentTestDocumentSchema as SafeParseSchema,
  "3.0.1:qtiMetadataDocument": QtiV3_0_1.QtiMetadataDocumentSchema as SafeParseSchema,
  "3.0.1:qtiOutcomeDeclarationDocument": QtiV3_0_1.QtiOutcomeDeclarationDocumentSchema as SafeParseSchema,
  "3.0.1:qtiOutcomeProcessingDocument": QtiV3_0_1.QtiOutcomeProcessingDocumentSchema as SafeParseSchema,
  "3.0.1:qtiResponseProcessingDocument": QtiV3_0_1.QtiResponseProcessingDocumentSchema as SafeParseSchema,
  "3.0.1:qtiUsageDataDocument": QtiV3_0_1.QtiUsageDataDocumentSchema as SafeParseSchema,
};

const normalizationImplemented = new Set<string>([
  "2.2:qtiAssessmentItemDocument",
  "2.2:qtiUsageDataDocument",
  "3.0.1:qtiAccessForAllPnpDocument",
  "3.0.1:qtiAccessForAllPnpRecordsDocument",
  "2.2:qtiManifestDocument",
  "3.0.1:qtiAssessmentItemDocument",
  "3.0.1:qtiAssessmentResultDocument",
  "3.0.1:qtiAssessmentSectionDocument",
  "3.0.1:qtiAssessmentStimulusDocument",
  "3.0.1:qtiAssessmentTestDocument",
  "3.0.1:qtiMetadataDocument",
  "3.0.1:qtiOutcomeDeclarationDocument",
  "3.0.1:qtiOutcomeProcessingDocument",
  "3.0.1:qtiResponseProcessingDocument",
  "3.0.1:qtiUsageDataDocument",
]);

export function isNormalizationImplemented(version: QtiVersion, key: QtiSchemaSelectionKey): boolean {
  return normalizationImplemented.has(`${version}:${key}`);
}

export function selectQtiSchema(rootDetection: QtiRootDetection): QtiSchemaSelection | undefined {
  if (!rootDetection.inferredVersion || !rootDetection.schemaSelectionKey) {
    return undefined;
  }

  const schema = registry[`${rootDetection.inferredVersion}:${rootDetection.schemaSelectionKey}`];
  if (!schema) {
    return undefined;
  }

  return {
    version: rootDetection.inferredVersion,
    key: rootDetection.schemaSelectionKey,
    schema,
  };
}
