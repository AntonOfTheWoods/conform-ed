import { z } from "zod";

import {
  QtiBaseTypeSchema,
  QtiCardinalitySchema,
  QtiCoordsSchema,
  QtiExternalScoredSchema,
  QtiIdentifierSchema,
  QtiMimeTypeSchema,
  QtiShapeSchema,
  QtiViewSchema,
  addIssue,
  looseObject,
  strictObject,
} from "./shared";

export const QtiValueSchema = strictObject({
  value: z.string(),
  fieldIdentifier: QtiIdentifierSchema.optional(),
  baseType: QtiBaseTypeSchema.optional(),
});

export const QtiDefaultValueSchema = strictObject({
  values: z.array(QtiValueSchema).min(1),
  interpretation: z.string().optional(),
});

export const QtiCorrectResponseSchema = strictObject({
  values: z.array(QtiValueSchema).min(1),
  interpretation: z.string().optional(),
});

export const QtiAreaMapEntrySchema = strictObject({
  shape: QtiShapeSchema,
  coords: QtiCoordsSchema,
  mappedValue: z.number(),
});

export const QtiAreaMappingSchema = strictObject({
  areaMapEntries: z.array(QtiAreaMapEntrySchema).min(1),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
  defaultValue: z.number().optional(),
});

export const QtiMapEntrySchema = strictObject({
  mapKey: z.string(),
  mappedValue: z.number(),
  caseSensitive: z.boolean().optional(),
});

export const QtiMappingSchema = strictObject({
  mapEntries: z.array(QtiMapEntrySchema).min(1),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
  defaultValue: z.number().optional(),
});

export const QtiInterpolationTableEntrySchema = strictObject({
  sourceValue: z.number(),
  includeBoundary: z.boolean().optional(),
  targetValue: z.string(),
});

export const QtiInterpolationTableSchema = strictObject({
  interpolationTableEntries: z.array(QtiInterpolationTableEntrySchema).min(1),
  defaultValue: z.string().optional(),
});

export const QtiMatchTableEntrySchema = strictObject({
  sourceValue: z.number().int(),
  targetValue: z.string(),
});

export const QtiMatchTableSchema = strictObject({
  matchTableEntries: z.array(QtiMatchTableEntrySchema).min(1),
  defaultValue: z.string().optional(),
});

export const QtiStyleSheetSchema = strictObject({
  href: z.string(),
  type: QtiMimeTypeSchema,
  media: z.string().optional(),
  title: z.string().optional(),
});

export const QtiCatalogSchema = looseObject({
  kind: z.literal("catalog"),
  content: z.array(z.unknown()).optional(),
});

export const QtiCatalogInfoSchema = strictObject({
  catalogs: z.array(QtiCatalogSchema).min(1),
});

export const QtiItemSessionControlSchema = strictObject({
  maxAttempts: z.number().int().optional(),
  showFeedback: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  showSolution: z.boolean().optional(),
  allowComment: z.boolean().optional(),
  allowSkipping: z.boolean().optional(),
  validateResponses: z.boolean().optional(),
});

export const QtiTimeLimitsSchema = strictObject({
  minTime: z.number().nonnegative().optional(),
  maxTime: z.number().nonnegative().optional(),
  allowLateSubmission: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.minTime !== undefined && value.maxTime !== undefined && value.minTime > value.maxTime) {
    addIssue(context, ["maxTime"], "maxTime must be greater than or equal to minTime.");
  }
});

export const QtiVariableMappingSchema = strictObject({
  sourceIdentifier: QtiIdentifierSchema,
  targetIdentifier: QtiIdentifierSchema,
});

export const QtiWeightSchema = strictObject({
  identifier: QtiIdentifierSchema,
  value: z.number(),
});

function validateValuesForCardinality(
  values: readonly z.infer<typeof QtiValueSchema>[] | undefined,
  cardinality: z.infer<typeof QtiCardinalitySchema>,
  context: z.RefinementCtx,
  path: Array<string | number>,
) {
  if (!values?.length) {
    return;
  }

  if (cardinality === "record") {
    for (const [index, value] of values.entries()) {
      if (!value.fieldIdentifier) {
        addIssue(
          context,
          [...path, index, "fieldIdentifier"],
          "Record cardinality values must define fieldIdentifier.",
        );
      }
    }
    return;
  }

  for (const [index, value] of values.entries()) {
    if (value.fieldIdentifier) {
      addIssue(
        context,
        [...path, index, "fieldIdentifier"],
        "fieldIdentifier is only valid for record cardinality values.",
      );
    }
  }
}

function validateDeclarationBaseType(
  cardinality: z.infer<typeof QtiCardinalitySchema>,
  baseType: z.infer<typeof QtiBaseTypeSchema> | undefined,
  context: z.RefinementCtx,
) {
  if (cardinality === "record" && baseType) {
    addIssue(context, ["baseType"], "baseType must be omitted when cardinality is record.");
  }
}

const QtiVariableDeclarationBaseShape = {
  identifier: QtiIdentifierSchema,
  cardinality: QtiCardinalitySchema,
  baseType: QtiBaseTypeSchema.optional(),
};

export const QtiContextDeclarationSchema = strictObject({
  ...QtiVariableDeclarationBaseShape,
  defaultValue: QtiDefaultValueSchema.optional(),
}).superRefine((value, context) => {
  validateDeclarationBaseType(value.cardinality, value.baseType, context);
  validateValuesForCardinality(value.defaultValue?.values, value.cardinality, context, ["defaultValue", "values"]);
});

export const QtiTemplateDeclarationSchema = strictObject({
  ...QtiVariableDeclarationBaseShape,
  defaultValue: QtiDefaultValueSchema.optional(),
  paramVariable: z.boolean().optional(),
  mathVariable: z.boolean().optional(),
}).superRefine((value, context) => {
  validateDeclarationBaseType(value.cardinality, value.baseType, context);
  validateValuesForCardinality(value.defaultValue?.values, value.cardinality, context, ["defaultValue", "values"]);
});

export const QtiResponseDeclarationRawSchema = strictObject({
  ...QtiVariableDeclarationBaseShape,
  defaultValue: QtiDefaultValueSchema.optional(),
  correctResponse: QtiCorrectResponseSchema.optional(),
  mapping: QtiMappingSchema.optional(),
  areaMapping: QtiAreaMappingSchema.optional(),
});

export const QtiResponseDeclarationSchema = QtiResponseDeclarationRawSchema.superRefine((value, context) => {
  validateDeclarationBaseType(value.cardinality, value.baseType, context);
  validateValuesForCardinality(value.defaultValue?.values, value.cardinality, context, ["defaultValue", "values"]);
  validateValuesForCardinality(value.correctResponse?.values, value.cardinality, context, [
    "correctResponse",
    "values",
  ]);

  if (value.areaMapping && value.baseType !== "point") {
    addIssue(context, ["areaMapping"], "areaMapping is only valid for response declarations with baseType 'point'.");
  }

  if (value.mapping && (value.baseType === "file" || value.baseType === "duration" || value.cardinality === "record")) {
    addIssue(context, ["mapping"], "mapping is not valid for file, duration, or record-valued response declarations.");
  }
});

export const QtiOutcomeDeclarationRawSchema = strictObject({
  ...QtiVariableDeclarationBaseShape,
  defaultValue: QtiDefaultValueSchema.optional(),
  matchTable: QtiMatchTableSchema.optional(),
  interpolationTable: QtiInterpolationTableSchema.optional(),
  view: z.array(QtiViewSchema).optional(),
  interpretation: z.string().optional(),
  longInterpretation: z.string().optional(),
  normalMaximum: z.number().optional(),
  normalMinimum: z.number().optional(),
  masteryValue: z.number().optional(),
  externalScored: QtiExternalScoredSchema.optional(),
  variableIdentifierRef: QtiIdentifierSchema.optional(),
});

export const QtiOutcomeDeclarationSchema = QtiOutcomeDeclarationRawSchema.superRefine((value, context) => {
  validateDeclarationBaseType(value.cardinality, value.baseType, context);
  validateValuesForCardinality(value.defaultValue?.values, value.cardinality, context, ["defaultValue", "values"]);

  if (value.matchTable && value.interpolationTable) {
    addIssue(context, ["matchTable"], "Only one of matchTable or interpolationTable may be supplied.");
  }

  if (
    value.normalMinimum !== undefined &&
    value.normalMaximum !== undefined &&
    value.normalMinimum > value.normalMaximum
  ) {
    addIssue(context, ["normalMaximum"], "normalMaximum must be greater than or equal to normalMinimum.");
  }
});
