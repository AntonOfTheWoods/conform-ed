import { z } from "zod";

import {
  addIssue,
  QtiBaseTypeSchema,
  QtiCoordsSchema,
  QtiIdentifierSchema,
  QtiIdentifierListSchema,
  QtiIntegerOrVariableSchema,
  QtiNumberOrVariableSchema,
  QtiShapeSchema,
  strictObject,
} from "./shared";

const unaryExpressionKinds = [
  "not",
  "random",
  "round",
  "truncate",
  "containerSize",
  "isNull",
  "integerToFloat",
] as const;

const binaryExpressionKinds = [
  "gt",
  "lt",
  "gte",
  "lte",
  "durationLt",
  "durationGte",
  "subtract",
  "divide",
  "delete",
  "match",
  "integerDivide",
  "integerModulus",
  "contains",
  "member",
  "power",
] as const;

const oneToManyExpressionKinds = ["and", "or", "sum", "product", "lcm", "gcd", "min", "max"] as const;

const containerExpressionKinds = ["multiple", "ordered"] as const;

const qtiRoundingModeValues = ["decimalPlaces", "significantFigures"] as const;
const qtiStatsOperatorNames = ["mean", "sampleVariance", "sampleSD", "popVariance", "popSD"] as const;
const qtiMathOperatorNames = [
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "asin",
  "acos",
  "atan",
  "atan2",
  "asec",
  "acsc",
  "acot",
  "sinh",
  "cosh",
  "tanh",
  "sech",
  "csch",
  "coth",
  "log",
  "ln",
  "exp",
  "abs",
  "signum",
  "floor",
  "ceil",
  "toDegrees",
  "toRadians",
] as const;

const QtiRoundingModeSchema = z.enum(qtiRoundingModeValues);
const QtiStatsOperatorNameSchema = z.enum(qtiStatsOperatorNames);
const QtiMathOperatorNameSchema = z.enum(qtiMathOperatorNames);

const QtiOutcomeSubsetSelectionShape = {
  sectionIdentifier: QtiIdentifierSchema.optional(),
  includeCategory: QtiIdentifierListSchema.optional(),
  excludeCategory: QtiIdentifierListSchema.optional(),
};

function validatePositiveNumericLiteral(
  value: number | string | undefined,
  context: z.RefinementCtx,
  path: Array<string | number>,
  label: string,
  minimum = 1,
) {
  if (typeof value === "number" && value < minimum) {
    addIssue(context, path, `${label} must be greater than or equal to ${minimum}.`);
  }
}

function validateOrderedNumericLiteralRange(
  min: number | string | undefined,
  max: number | string | undefined,
  context: z.RefinementCtx,
  path: Array<string | number>,
  label: string,
) {
  if (typeof min === "number" && typeof max === "number" && min > max) {
    addIssue(context, path, `${label} minimum must not exceed its maximum.`);
  }
}

export const QtiIncludeSchema = strictObject({
  kind: z.literal("include"),
  href: z.string().optional(),
  parse: z.string().optional(),
  xpointer: z.string().optional(),
});

export const QtiNullExpressionSchema = strictObject({
  kind: z.literal("null"),
});

export const QtiBaseValueExpressionSchema = strictObject({
  kind: z.literal("baseValue"),
  baseType: QtiBaseTypeSchema,
  value: z.string(),
});

export const QtiVariableExpressionSchema = strictObject({
  kind: z.literal("variable"),
  identifier: QtiIdentifierSchema,
  weightIdentifier: QtiIdentifierSchema.optional(),
});

export const QtiCorrectExpressionSchema = strictObject({
  kind: z.literal("correct"),
  identifier: QtiIdentifierSchema,
});

export const QtiDefaultExpressionSchema = strictObject({
  kind: z.literal("default"),
  identifier: QtiIdentifierSchema,
});

export const QtiMapResponseExpressionSchema = strictObject({
  kind: z.literal("mapResponse"),
  identifier: QtiIdentifierSchema,
});

export const QtiMapResponsePointExpressionSchema = strictObject({
  kind: z.literal("mapResponsePoint"),
  identifier: QtiIdentifierSchema,
});

export const QtiRandomIntegerExpressionSchema = strictObject({
  kind: z.literal("randomInteger"),
  min: QtiIntegerOrVariableSchema.optional(),
  max: QtiIntegerOrVariableSchema,
  step: QtiIntegerOrVariableSchema.optional(),
}).superRefine((value, context) => {
  validateOrderedNumericLiteralRange(value.min, value.max, context, ["max"], "randomInteger");
  validatePositiveNumericLiteral(value.step, context, ["step"], "randomInteger step");
});

export const QtiRandomFloatExpressionSchema = strictObject({
  kind: z.literal("randomFloat"),
  min: QtiNumberOrVariableSchema.optional(),
  max: QtiNumberOrVariableSchema,
}).superRefine((value, context) => {
  validateOrderedNumericLiteralRange(value.min, value.max, context, ["max"], "randomFloat");
});

export const QtiMathConstantExpressionSchema = strictObject({
  kind: z.literal("mathConstant"),
  name: z.enum(["pi", "e"]),
});

export const QtiUnaryExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.enum(unaryExpressionKinds),
    children: z.tuple([QtiExpressionSchema]),
  }),
);

export const QtiBinaryExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.enum(binaryExpressionKinds),
    children: z.tuple([QtiExpressionSchema, QtiExpressionSchema]),
  }),
);

export const QtiOneToManyExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.enum(oneToManyExpressionKinds),
    children: z.array(QtiExpressionSchema).min(1),
  }),
);

export const QtiContainerExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.enum(containerExpressionKinds),
    children: z.array(QtiExpressionSchema),
  }),
);

export const QtiCustomOperatorExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("customOperator"),
    children: z.array(QtiExpressionSchema).optional(),
    class: QtiIdentifierSchema.optional(),
    definition: z.string().optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
  }),
);

export const QtiAnyNExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("anyN"),
    children: z.array(QtiExpressionSchema).min(1),
    min: QtiIntegerOrVariableSchema,
    max: QtiIntegerOrVariableSchema,
  }).superRefine((value, context) => {
    validatePositiveNumericLiteral(value.min, context, ["min"], "anyN min", 0);
    validatePositiveNumericLiteral(value.max, context, ["max"], "anyN max", 0);
    validateOrderedNumericLiteralRange(value.min, value.max, context, ["max"], "anyN");

    if (typeof value.min === "number" && value.min > value.children.length) {
      addIssue(context, ["min"], "anyN min must not exceed the number of child expressions.");
    }

    if (typeof value.max === "number" && value.max > value.children.length) {
      addIssue(context, ["max"], "anyN max must not exceed the number of child expressions.");
    }
  }),
);

export const QtiEqualExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("equal"),
    children: z.tuple([QtiExpressionSchema, QtiExpressionSchema]),
    toleranceMode: z.enum(["exact", "absolute", "relative"]).optional(),
    tolerance: z.array(QtiNumberOrVariableSchema).min(1).max(2).optional(),
    includeLowerBound: z.boolean().optional(),
    includeUpperBound: z.boolean().optional(),
  }),
);

export const QtiEqualRoundedExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("equalRounded"),
    children: z.tuple([QtiExpressionSchema, QtiExpressionSchema]),
    roundingMode: QtiRoundingModeSchema.optional(),
    figures: QtiIntegerOrVariableSchema,
  }).superRefine((value, context) => {
    validatePositiveNumericLiteral(value.figures, context, ["figures"], "equalRounded figures");
  }),
);

export const QtiFieldValueExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("fieldValue"),
    children: z.tuple([QtiExpressionSchema]),
    fieldIdentifier: QtiIdentifierSchema,
  }),
);

export const QtiIndexExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("index"),
    children: z.tuple([QtiExpressionSchema]),
    n: QtiIntegerOrVariableSchema,
  }).superRefine((value, context) => {
    validatePositiveNumericLiteral(value.n, context, ["n"], "index n");
  }),
);

export const QtiInsideExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("inside"),
    children: z.tuple([QtiExpressionSchema]),
    shape: QtiShapeSchema,
    coords: QtiCoordsSchema,
  }),
);

export const QtiMathOperatorExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("mathOperator"),
    children: z.array(QtiExpressionSchema).min(1),
    name: QtiMathOperatorNameSchema,
  }).superRefine((value, context) => {
    const expectedArity = value.name === "atan2" ? 2 : 1;

    if (value.children.length !== expectedArity) {
      addIssue(
        context,
        ["children"],
        `mathOperator '${value.name}' requires exactly ${expectedArity} operand${expectedArity === 1 ? "" : "s"}.`,
      );
    }
  }),
);

export const QtiPatternMatchExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("patternMatch"),
    children: z.tuple([QtiExpressionSchema]),
    pattern: z.string(),
  }),
);

export const QtiRepeatExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("repeat"),
    children: z.array(QtiExpressionSchema).min(1),
    numberRepeats: QtiIntegerOrVariableSchema,
  }).superRefine((value, context) => {
    validatePositiveNumericLiteral(value.numberRepeats, context, ["numberRepeats"], "repeat numberRepeats");
  }),
);

export const QtiRoundToExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("roundTo"),
    children: z.tuple([QtiExpressionSchema]),
    roundingMode: QtiRoundingModeSchema,
    figures: QtiIntegerOrVariableSchema,
  }).superRefine((value, context) => {
    validatePositiveNumericLiteral(value.figures, context, ["figures"], "roundTo figures");
  }),
);

export const QtiStatsOperatorExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("statsOperator"),
    children: z.tuple([QtiExpressionSchema]),
    name: QtiStatsOperatorNameSchema,
  }),
);

export const QtiStringMatchExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("stringMatch"),
    children: z.tuple([QtiExpressionSchema, QtiExpressionSchema]),
    caseSensitive: z.boolean(),
    substring: z.boolean().optional(),
  }),
);

export const QtiSubstringExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("substring"),
    children: z.tuple([QtiExpressionSchema, QtiExpressionSchema]),
    caseSensitive: z.boolean(),
  }),
);

export const QtiNumberCorrectExpressionSchema = strictObject({
  kind: z.literal("numberCorrect"),
  ...QtiOutcomeSubsetSelectionShape,
});

export const QtiNumberIncorrectExpressionSchema = strictObject({
  kind: z.literal("numberIncorrect"),
  ...QtiOutcomeSubsetSelectionShape,
});

export const QtiNumberPresentedExpressionSchema = strictObject({
  kind: z.literal("numberPresented"),
  ...QtiOutcomeSubsetSelectionShape,
});

export const QtiNumberRespondedExpressionSchema = strictObject({
  kind: z.literal("numberResponded"),
  ...QtiOutcomeSubsetSelectionShape,
});

export const QtiNumberSelectedExpressionSchema = strictObject({
  kind: z.literal("numberSelected"),
  ...QtiOutcomeSubsetSelectionShape,
});

export const QtiOutcomeMinimumExpressionSchema = strictObject({
  kind: z.literal("outcomeMinimum"),
  ...QtiOutcomeSubsetSelectionShape,
  outcomeIdentifier: QtiIdentifierSchema,
  weightIdentifier: QtiIdentifierSchema.optional(),
});

export const QtiOutcomeMaximumExpressionSchema = strictObject({
  kind: z.literal("outcomeMaximum"),
  ...QtiOutcomeSubsetSelectionShape,
  outcomeIdentifier: QtiIdentifierSchema,
  weightIdentifier: QtiIdentifierSchema.optional(),
});

export const QtiTestVariablesExpressionSchema = strictObject({
  kind: z.literal("testVariables"),
  ...QtiOutcomeSubsetSelectionShape,
  variableIdentifier: QtiIdentifierSchema,
  weightIdentifier: QtiIdentifierSchema.optional(),
  baseType: QtiBaseTypeSchema.optional(),
});

export const QtiExpressionSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    QtiNullExpressionSchema,
    QtiBaseValueExpressionSchema,
    QtiVariableExpressionSchema,
    QtiCorrectExpressionSchema,
    QtiDefaultExpressionSchema,
    QtiMapResponseExpressionSchema,
    QtiMapResponsePointExpressionSchema,
    QtiRandomIntegerExpressionSchema,
    QtiRandomFloatExpressionSchema,
    QtiMathConstantExpressionSchema,
    QtiUnaryExpressionSchema,
    QtiBinaryExpressionSchema,
    QtiOneToManyExpressionSchema,
    QtiContainerExpressionSchema,
    QtiCustomOperatorExpressionSchema,
    QtiAnyNExpressionSchema,
    QtiEqualExpressionSchema,
    QtiEqualRoundedExpressionSchema,
    QtiFieldValueExpressionSchema,
    QtiIndexExpressionSchema,
    QtiInsideExpressionSchema,
    QtiMathOperatorExpressionSchema,
    QtiPatternMatchExpressionSchema,
    QtiRepeatExpressionSchema,
    QtiRoundToExpressionSchema,
    QtiStatsOperatorExpressionSchema,
    QtiStringMatchExpressionSchema,
    QtiSubstringExpressionSchema,
    QtiNumberCorrectExpressionSchema,
    QtiNumberIncorrectExpressionSchema,
    QtiNumberPresentedExpressionSchema,
    QtiNumberRespondedExpressionSchema,
    QtiNumberSelectedExpressionSchema,
    QtiOutcomeMinimumExpressionSchema,
    QtiOutcomeMaximumExpressionSchema,
    QtiTestVariablesExpressionSchema,
  ]),
);

export const QtiPreConditionSchema = strictObject({
  kind: z.literal("preCondition"),
  expression: QtiExpressionSchema,
});

export const QtiBranchRuleSchema = strictObject({
  kind: z.literal("branchRule"),
  target: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiLookupOutcomeValueSchema = strictObject({
  kind: z.literal("lookupOutcomeValue"),
  identifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiSetOutcomeValueSchema = strictObject({
  kind: z.literal("setOutcomeValue"),
  identifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiSetTemplateValueSchema = strictObject({
  kind: z.literal("setTemplateValue"),
  identifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiSetDefaultValueSchema = strictObject({
  kind: z.literal("setDefaultValue"),
  identifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiSetCorrectResponseSchema = strictObject({
  kind: z.literal("setCorrectResponse"),
  identifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiTemplateDefaultSchema = strictObject({
  kind: z.literal("templateDefault"),
  templateIdentifier: QtiIdentifierSchema,
  expression: QtiExpressionSchema,
});

export const QtiTemplateConstraintSchema = strictObject({
  kind: z.literal("templateConstraint"),
  expression: QtiExpressionSchema,
});

export const QtiExitResponseSchema = strictObject({
  kind: z.literal("exitResponse"),
});

export const QtiExitTemplateSchema = strictObject({
  kind: z.literal("exitTemplate"),
});

export const QtiExitTestSchema = strictObject({
  kind: z.literal("exitTest"),
});

export const QtiResponseElseSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("responseElse"),
    actions: z.array(QtiResponseRuleSchema).optional(),
  }),
);

export const QtiResponseIfSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("responseIf"),
    expression: QtiExpressionSchema,
    actions: z.array(QtiResponseRuleSchema).optional(),
  }),
);

export const QtiResponseConditionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("responseCondition"),
    responseIf: QtiResponseIfSchema,
    responseElseIf: z.array(QtiResponseIfSchema).optional(),
    responseElse: QtiResponseElseSchema.optional(),
  }),
);

export const QtiResponseProcessingFragmentSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("responseProcessingFragment"),
    rules: z.array(QtiResponseRuleSchema).optional(),
  }),
);

export const QtiResponseRuleSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    QtiIncludeSchema,
    QtiResponseConditionSchema,
    QtiResponseProcessingFragmentSchema,
    QtiSetOutcomeValueSchema,
    QtiExitResponseSchema,
    QtiLookupOutcomeValueSchema,
  ]),
);

export const QtiResponseProcessingSchema = strictObject({
  rules: z.array(QtiResponseRuleSchema).optional(),
  template: z.string().optional(),
  templateLocation: z.string().optional(),
});

export const QtiOutcomeElseSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("outcomeElse"),
    actions: z.array(QtiOutcomeRuleSchema).optional(),
  }),
);

export const QtiOutcomeIfSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("outcomeIf"),
    expression: QtiExpressionSchema,
    actions: z.array(QtiOutcomeRuleSchema).optional(),
  }),
);

export const QtiOutcomeConditionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("outcomeCondition"),
    outcomeIf: QtiOutcomeIfSchema,
    outcomeElseIf: z.array(QtiOutcomeIfSchema).optional(),
    outcomeElse: QtiOutcomeElseSchema.optional(),
  }),
);

export const QtiOutcomeProcessingFragmentSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("outcomeProcessingFragment"),
    rules: z.array(QtiOutcomeRuleSchema).optional(),
  }),
);

export const QtiOutcomeRuleSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    QtiIncludeSchema,
    QtiOutcomeConditionSchema,
    QtiOutcomeProcessingFragmentSchema,
    QtiSetOutcomeValueSchema,
    QtiExitTestSchema,
    QtiLookupOutcomeValueSchema,
  ]),
);

export const QtiOutcomeProcessingSchema = strictObject({
  rules: z.array(QtiOutcomeRuleSchema).optional(),
});

export const QtiTemplateElseSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("templateElse"),
    actions: z.array(QtiTemplateRuleSchema).optional(),
  }),
);

export const QtiTemplateIfSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("templateIf"),
    expression: QtiExpressionSchema,
    actions: z.array(QtiTemplateRuleSchema).optional(),
  }),
);

export const QtiTemplateConditionSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("templateCondition"),
    templateIf: QtiTemplateIfSchema,
    templateElseIf: z.array(QtiTemplateIfSchema).optional(),
    templateElse: QtiTemplateElseSchema.optional(),
  }),
);

export const QtiTemplateRuleSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    QtiTemplateConditionSchema,
    QtiSetTemplateValueSchema,
    QtiSetDefaultValueSchema,
    QtiSetCorrectResponseSchema,
    QtiTemplateConstraintSchema,
    QtiExitTemplateSchema,
  ]),
);

export const QtiTemplateProcessingSchema = strictObject({
  rules: z.array(QtiTemplateRuleSchema).min(1),
});
// Inferred types from exported Zod validators.
export type QtiInclude = z.infer<typeof QtiIncludeSchema>;
export type QtiNullExpression = z.infer<typeof QtiNullExpressionSchema>;
export type QtiBaseValueExpression = z.infer<typeof QtiBaseValueExpressionSchema>;
export type QtiVariableExpression = z.infer<typeof QtiVariableExpressionSchema>;
export type QtiCorrectExpression = z.infer<typeof QtiCorrectExpressionSchema>;
export type QtiDefaultExpression = z.infer<typeof QtiDefaultExpressionSchema>;
export type QtiMapResponseExpression = z.infer<typeof QtiMapResponseExpressionSchema>;
export type QtiMapResponsePointExpression = z.infer<typeof QtiMapResponsePointExpressionSchema>;
export type QtiRandomIntegerExpression = z.infer<typeof QtiRandomIntegerExpressionSchema>;
export type QtiRandomFloatExpression = z.infer<typeof QtiRandomFloatExpressionSchema>;
export type QtiMathConstantExpression = z.infer<typeof QtiMathConstantExpressionSchema>;
export type QtiNumberCorrectExpression = z.infer<typeof QtiNumberCorrectExpressionSchema>;
export type QtiNumberIncorrectExpression = z.infer<typeof QtiNumberIncorrectExpressionSchema>;
export type QtiNumberPresentedExpression = z.infer<typeof QtiNumberPresentedExpressionSchema>;
export type QtiNumberRespondedExpression = z.infer<typeof QtiNumberRespondedExpressionSchema>;
export type QtiNumberSelectedExpression = z.infer<typeof QtiNumberSelectedExpressionSchema>;
export type QtiOutcomeMinimumExpression = z.infer<typeof QtiOutcomeMinimumExpressionSchema>;
export type QtiOutcomeMaximumExpression = z.infer<typeof QtiOutcomeMaximumExpressionSchema>;
export type QtiTestVariablesExpression = z.infer<typeof QtiTestVariablesExpressionSchema>;
export type QtiPreCondition = z.infer<typeof QtiPreConditionSchema>;
export type QtiBranchRule = z.infer<typeof QtiBranchRuleSchema>;
export type QtiLookupOutcomeValue = z.infer<typeof QtiLookupOutcomeValueSchema>;
export type QtiSetOutcomeValue = z.infer<typeof QtiSetOutcomeValueSchema>;
export type QtiSetTemplateValue = z.infer<typeof QtiSetTemplateValueSchema>;
export type QtiSetDefaultValue = z.infer<typeof QtiSetDefaultValueSchema>;
export type QtiSetCorrectResponse = z.infer<typeof QtiSetCorrectResponseSchema>;
export type QtiTemplateDefault = z.infer<typeof QtiTemplateDefaultSchema>;
export type QtiTemplateConstraint = z.infer<typeof QtiTemplateConstraintSchema>;
export type QtiExitResponse = z.infer<typeof QtiExitResponseSchema>;
export type QtiExitTemplate = z.infer<typeof QtiExitTemplateSchema>;
export type QtiExitTest = z.infer<typeof QtiExitTestSchema>;
export type QtiResponseProcessing = z.infer<typeof QtiResponseProcessingSchema>;
export type QtiOutcomeProcessing = z.infer<typeof QtiOutcomeProcessingSchema>;
export type QtiTemplateProcessing = z.infer<typeof QtiTemplateProcessingSchema>;
