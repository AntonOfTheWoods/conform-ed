import { z } from "zod";

import { QtiMapEntrySchema, QtiValueSchema } from "./variables-internal";
import { QtiIdentifierSchema, UriReferenceSchema, addIssue, strictObject } from "./shared";

export const QtiUsageDateSchema = z.iso.date();

export const QtiUsageObjectTypeSchema = z.enum([
  "test",
  "testpart",
  "section",
  "item",
  "outcome",
  "interaction",
  "choice",
]);

export const QtiUsageTargetObjectSchema = strictObject({
  identifier: z.string().min(1),
  partIdentifier: QtiIdentifierSchema.optional(),
  objectType: QtiUsageObjectTypeSchema.optional(),
});

export const QtiUsageMappingSchema = strictObject({
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
  defaultValue: z.number().optional(),
  mapEntries: z.array(QtiMapEntrySchema).min(1),
}).superRefine((value, context) => {
  if (value.lowerBound !== undefined && value.upperBound !== undefined && value.lowerBound > value.upperBound) {
    addIssue(context, ["upperBound"], "upperBound must be greater than or equal to lowerBound.");
  }
});

const QtiUsageStatisticBaseShape = {
  name: QtiIdentifierSchema,
  glossary: UriReferenceSchema.optional(),
  context: UriReferenceSchema,
  caseCount: z.number().int().nonnegative().optional(),
  stdError: z.number().optional(),
  stdDeviation: z.number().optional(),
  lastUpdated: QtiUsageDateSchema.optional(),
  targetObjects: z.array(QtiUsageTargetObjectSchema).min(1),
};

export const QtiOrdinaryStatisticSchema = strictObject({
  kind: z.literal("ordinaryStatistic"),
  ...QtiUsageStatisticBaseShape,
  value: QtiValueSchema,
});

export const QtiCategorizedStatisticSchema = strictObject({
  kind: z.literal("categorizedStatistic"),
  ...QtiUsageStatisticBaseShape,
  mapping: QtiUsageMappingSchema,
});

export const QtiUsageStatisticSchema = z.union([QtiOrdinaryStatisticSchema, QtiCategorizedStatisticSchema]);

export const QtiUsageDataSchema = strictObject({
  glossary: UriReferenceSchema.optional(),
  statistics: z.array(QtiUsageStatisticSchema).default([]),
});

export const QtiUsageDataDocumentSchema = strictObject({
  usageData: QtiUsageDataSchema,
});
