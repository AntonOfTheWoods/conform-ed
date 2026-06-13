/**
 * Universal QTI serialization dispatch: given a (version, schema-selection-key) and a
 * normalized document, emit the spec-valid XML instance against the matching binding.
 * The inverse of normalizeQtiDocument — delegating to the per-binding serializers
 * (ASI, manifest, results, usage data, PNP), each gated by its own export round trip.
 */

import {
  serializeQtiAssessmentItem,
  serializeQtiAssessmentSection,
  serializeQtiAssessmentStimulus,
  serializeQtiAssessmentTest,
  serializeQtiOutcomeDeclarationDocument,
  serializeQtiOutcomeProcessingDocument,
  serializeQtiResponseProcessingDocument,
} from "./serialize-asi";
import { serializeQtiManifest, serializeQtiMetadata } from "./serialize-manifest";
import { serializeQtiAccessForAllPnp, serializeQtiAccessForAllPnpRecords } from "./serialize-pnp";
import { serializeQtiAssessmentResult } from "./serialize-result";
import { serializeQtiUsageData } from "./serialize-usage-data";
import type { QtiSchemaSelectionKey, QtiVersion } from "./types";

/** Roots with a serializer registered (the export-conformant direction). */
export function isSerializationImplemented(version: QtiVersion, key: QtiSchemaSelectionKey): boolean {
  if (version === "2.2") {
    // The v2.2 usage data binding is structurally identical to the v3 one.
    return key === "qtiUsageDataDocument";
  }
  switch (key) {
    case "qtiAssessmentItemDocument":
    case "qtiAssessmentTestDocument":
    case "qtiAssessmentStimulusDocument":
    case "qtiAssessmentSectionDocument":
    case "qtiResponseProcessingDocument":
    case "qtiOutcomeDeclarationDocument":
    case "qtiOutcomeProcessingDocument":
    case "qtiMetadataDocument":
    case "qtiManifestDocument":
    case "qtiAssessmentResultDocument":
    case "qtiUsageDataDocument":
    case "qtiAccessForAllPnpDocument":
    case "qtiAccessForAllPnpRecordsDocument":
      return true;
    default:
      return false;
  }
}

export function serializeQtiDocument(version: QtiVersion, key: QtiSchemaSelectionKey, document: unknown): string {
  if (version === "2.2") {
    if (key === "qtiUsageDataDocument") {
      return serializeQtiUsageData(document as never);
    }
    throw new Error(`Serialization is not implemented for ${version} ${key}.`);
  }

  switch (key) {
    case "qtiAssessmentItemDocument":
      return serializeQtiAssessmentItem(document);
    case "qtiAssessmentTestDocument":
      return serializeQtiAssessmentTest(document);
    case "qtiAssessmentStimulusDocument":
      return serializeQtiAssessmentStimulus(document);
    case "qtiAssessmentSectionDocument":
      return serializeQtiAssessmentSection(document);
    case "qtiResponseProcessingDocument":
      return serializeQtiResponseProcessingDocument(document);
    case "qtiOutcomeDeclarationDocument":
      return serializeQtiOutcomeDeclarationDocument(document);
    case "qtiOutcomeProcessingDocument":
      return serializeQtiOutcomeProcessingDocument(document);
    case "qtiMetadataDocument":
      return serializeQtiMetadata(document);
    case "qtiManifestDocument":
      return serializeQtiManifest(document);
    case "qtiAssessmentResultDocument":
      return serializeQtiAssessmentResult(document as never);
    case "qtiUsageDataDocument":
      return serializeQtiUsageData(document as never);
    case "qtiAccessForAllPnpDocument":
      return serializeQtiAccessForAllPnp(document as never);
    case "qtiAccessForAllPnpRecordsDocument":
      return serializeQtiAccessForAllPnpRecords(document as never);
    default:
      // Exhaustive for v3: `key` is `never` here, so every binding the normalizer
      // reads has a writer. A future key lands as a compile error on this line.
      throw new Error(`Serialization is not implemented for ${version} ${String(key)}.`);
  }
}
