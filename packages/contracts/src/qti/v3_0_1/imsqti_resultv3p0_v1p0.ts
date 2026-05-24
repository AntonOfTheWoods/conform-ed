import { z } from "zod";

import {
  QtiAnsweredStatusSchema,
  QtiBaseTypeSchema,
  QtiCardinalitySchema,
  QtiExternalScoredSchema,
  QtiIdentifierListSchema,
  QtiIdentifierSchema,
  QtiScoreStatusSchema,
  QtiSessionStatusSchema,
  QtiSupportAssignmentSchema,
  QtiViewSchema,
  XmlExtensionNodeListSchema,
  addIssue,
  strictObject,
} from "./shared";

export const QtiResultValueSchema = strictObject({
  value: z.string(),
  fieldIdentifier: QtiIdentifierSchema.optional(),
  baseType: QtiBaseTypeSchema.optional(),
});

export const QtiResultCandidateResponseSchema = strictObject({
  values: z.array(QtiResultValueSchema).optional(),
});

export const QtiResultCorrectResponseSchema = strictObject({
  values: z.array(QtiResultValueSchema).min(1),
  interpretation: z.string().optional(),
});

export const QtiResultSessionIdentifierSchema = strictObject({
  sourceId: z.string(),
  identifier: QtiIdentifierSchema,
});

export const QtiResultContextSchema = strictObject({
  sourcedId: QtiIdentifierSchema.optional(),
  sessionIdentifiers: z.array(QtiResultSessionIdentifierSchema).optional(),
});

export const QtiResultSupportSchema = strictObject({
  name: z.string().min(1),
  assignment: QtiSupportAssignmentSchema,
  value: z.string().optional(),
  xmlLang: z.string().optional(),
});

const QtiResultVariableBaseShape = {
  identifier: QtiIdentifierSchema,
  cardinality: QtiCardinalitySchema,
  baseType: QtiBaseTypeSchema.optional(),
  values: z.array(QtiResultValueSchema).optional(),
};

export const QtiResultContextVariableSchema = strictObject({
  ...QtiResultVariableBaseShape,
});

export const QtiResultTemplateVariableSchema = strictObject({
  ...QtiResultVariableBaseShape,
});

export const QtiResultOutcomeInformationSchema = strictObject({
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const QtiResultOutcomeVariableSchema = strictObject({
  ...QtiResultVariableBaseShape,
  outcomeInformation: QtiResultOutcomeInformationSchema.optional(),
  view: z.array(QtiViewSchema).optional(),
  interpretation: z.string().optional(),
  longInterpretation: z.string().optional(),
  normalMaximum: z.number().optional(),
  normalMinimum: z.number().optional(),
  masteryValue: z.number().optional(),
  externalScored: QtiExternalScoredSchema.optional(),
  variableIdentifierRef: QtiIdentifierSchema.optional(),
});

export const QtiResultResponseVariableSchema = strictObject({
  ...QtiResultVariableBaseShape,
  correctResponse: QtiResultCorrectResponseSchema.optional(),
  candidateResponse: QtiResultCandidateResponseSchema,
  extensions: XmlExtensionNodeListSchema.optional(),
  choiceSequence: QtiIdentifierListSchema.optional(),
  scoreStatus: QtiScoreStatusSchema.optional(),
  answeredStatus: QtiAnsweredStatusSchema.optional(),
});

function validateValuesForCardinality(
  values: readonly z.infer<typeof QtiResultValueSchema>[] | undefined,
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
          "Record-valued result entries must define fieldIdentifier.",
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
        "fieldIdentifier is only valid for record-valued results.",
      );
    }
  }
}

function createVariableSuperRefine(valueKey: "values" | "candidateResponse", candidateResponseKey?: "values") {
  return (
    value: {
      cardinality: z.infer<typeof QtiCardinalitySchema>;
      baseType?: z.infer<typeof QtiBaseTypeSchema>;
      values?: readonly z.infer<typeof QtiResultValueSchema>[];
      candidateResponse?: { values?: readonly z.infer<typeof QtiResultValueSchema>[] };
    },
    context: z.RefinementCtx,
  ) => {
    if (value.cardinality === "record" && value.baseType) {
      addIssue(context, ["baseType"], "baseType must be omitted when cardinality is record.");
    }

    if (valueKey === "values") {
      validateValuesForCardinality(value.values, value.cardinality, context, ["values"]);
      return;
    }

    validateValuesForCardinality(
      value.candidateResponse?.[candidateResponseKey ?? "values"],
      value.cardinality,
      context,
      ["candidateResponse", candidateResponseKey ?? "values"],
    );
  };
}

export const QtiResultOutcomeVariableValidatedSchema = QtiResultOutcomeVariableSchema.superRefine(
  createVariableSuperRefine("values"),
);

export const QtiResultContextVariableValidatedSchema = QtiResultContextVariableSchema.superRefine(
  createVariableSuperRefine("values"),
);

export const QtiResultTemplateVariableValidatedSchema = QtiResultTemplateVariableSchema.superRefine(
  createVariableSuperRefine("values"),
);

export const QtiResultResponseVariableValidatedSchema = QtiResultResponseVariableSchema.superRefine(
  createVariableSuperRefine("candidateResponse", "values"),
);

export const QtiResultTestResultSchema = strictObject({
  identifier: QtiIdentifierSchema,
  datestamp: z.string(),
  responseVariables: z.array(QtiResultResponseVariableValidatedSchema).optional(),
  templateVariables: z.array(QtiResultTemplateVariableValidatedSchema).optional(),
  outcomeVariables: z.array(QtiResultOutcomeVariableValidatedSchema).optional(),
  contextVariables: z.array(QtiResultContextVariableValidatedSchema).optional(),
  supports: z.array(QtiResultSupportSchema).optional(),
});

export const QtiResultItemResultSchema = strictObject({
  identifier: QtiIdentifierSchema,
  sequenceIndex: z.number().int().optional(),
  datestamp: z.string(),
  sessionStatus: QtiSessionStatusSchema,
  responseVariables: z.array(QtiResultResponseVariableValidatedSchema).optional(),
  templateVariables: z.array(QtiResultTemplateVariableValidatedSchema).optional(),
  outcomeVariables: z.array(QtiResultOutcomeVariableValidatedSchema).optional(),
  contextVariables: z.array(QtiResultContextVariableValidatedSchema).optional(),
  candidateComment: z.string().optional(),
  supports: z.array(QtiResultSupportSchema).optional(),
});

export const QtiAssessmentResultSchema = strictObject({
  context: QtiResultContextSchema,
  testResult: QtiResultTestResultSchema.optional(),
  itemResults: z.array(QtiResultItemResultSchema).optional(),
});

export const QtiAssessmentResultDocumentSchema = strictObject({
  assessmentResult: QtiAssessmentResultSchema,
});
