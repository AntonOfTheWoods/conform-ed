import { z } from "zod";

import {
  NonEmptyStringSchema,
  YesNoSchema,
  XmlSpaceSchema,
  addIssue,
  asArray,
  collectDuplicates,
  strictObject,
} from "./shared";

export const QtiMatTextSchema = strictObject({
  kind: z.literal("mattext"),
  value: z.string(),
  texttype: z.string().optional(),
  charset: z.string().optional(),
  label: z.string().optional(),
  uri: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  x0: z.string().optional(),
  y0: z.string().optional(),
  xmlLang: z.string().optional(),
  xmlSpace: XmlSpaceSchema.optional(),
});

export const QtiMatRefSchema = strictObject({
  kind: z.literal("matref"),
  linkrefid: NonEmptyStringSchema,
});

export const QtiMatBreakSchema = strictObject({
  kind: z.literal("matbreak"),
});

export const QtiMaterialRefSchema = strictObject({
  kind: z.literal("material_ref"),
  linkrefid: NonEmptyStringSchema,
});

export const QtiMaterialChildSchema = z.union([QtiMatTextSchema, QtiMatRefSchema, QtiMatBreakSchema]);

export const QtiAltMaterialSchema = strictObject({
  kind: z.literal("altmaterial"),
  xmlLang: z.string().optional(),
  children: z.array(QtiMaterialChildSchema).min(1),
});

export const QtiMaterialSchema = strictObject({
  kind: z.literal("material"),
  label: z.string().optional(),
  xmlLang: z.string().optional(),
  children: z.array(QtiMaterialChildSchema).min(1),
  altmaterial: z.array(QtiAltMaterialSchema).optional(),
});

export const QtiFlowMatSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("flow_mat"),
    class: z.string().optional(),
    children: z.array(z.union([QtiFlowMatSchema, QtiMaterialSchema, QtiMaterialRefSchema])).min(1),
  }),
);

export const QtiResponseLabelSchema = strictObject({
  kind: z.literal("response_label"),
  ident: NonEmptyStringSchema,
  labelrefid: z.string().optional(),
  rshuffle: YesNoSchema.optional(),
  match_group: z.string().optional(),
  match_max: z.string().optional(),
  children: z.array(z.union([QtiMaterialSchema, QtiMaterialRefSchema, QtiFlowMatSchema])).optional(),
});

export const QtiFlowLabelSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("flow_label"),
    class: z.string().optional(),
    children: z.array(z.union([QtiFlowLabelSchema, QtiResponseLabelSchema])).min(1),
  }),
);

export const QtiRenderChoiceSchema = strictObject({
  kind: z.literal("render_choice"),
  shuffle: YesNoSchema.optional(),
  minnumber: z.string().optional(),
  maxnumber: z.string().optional(),
  children: z
    .array(z.union([QtiMaterialSchema, QtiMaterialRefSchema, QtiResponseLabelSchema, QtiFlowLabelSchema]))
    .optional(),
});

export const QtiRenderFibSchema = strictObject({
  kind: z.literal("render_fib"),
  encoding: z.string().optional(),
  charset: z.string().optional(),
  rows: z.string().optional(),
  columns: z.string().optional(),
  maxchars: z.string().optional(),
  minnumber: z.string().optional(),
  maxnumber: z.string().optional(),
  prompt: z.enum(["Asterisk", "Box", "Dashline", "Underline"]).optional(),
  fibtype: z.enum(["Decimal", "Integer", "Scientific", "String"]).optional(),
  children: z
    .array(z.union([QtiMaterialSchema, QtiMaterialRefSchema, QtiResponseLabelSchema, QtiFlowLabelSchema]))
    .optional(),
});

const QtiResponseRenderSchema = z.union([QtiRenderChoiceSchema, QtiRenderFibSchema]);
const QtiLeadingOrTrailingMaterialSchema = z.union([QtiMaterialSchema, QtiMaterialRefSchema]);

export const QtiResponseLidSchema = strictObject({
  kind: z.literal("response_lid"),
  ident: NonEmptyStringSchema,
  rcardinality: z.enum(["Single", "Multiple", "Ordered"]).optional(),
  rtiming: YesNoSchema.optional(),
  leading: QtiLeadingOrTrailingMaterialSchema.optional(),
  render: QtiResponseRenderSchema,
  trailing: QtiLeadingOrTrailingMaterialSchema.optional(),
});

export const QtiResponseStrSchema = strictObject({
  kind: z.literal("response_str"),
  ident: NonEmptyStringSchema,
  rcardinality: z.enum(["Single", "Multiple", "Ordered"]).optional(),
  rtiming: YesNoSchema.optional(),
  leading: QtiLeadingOrTrailingMaterialSchema.optional(),
  render: QtiResponseRenderSchema,
  trailing: QtiLeadingOrTrailingMaterialSchema.optional(),
});

export const QtiFlowSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("flow"),
    class: z.string().optional(),
    children: z
      .array(
        z.union([QtiFlowSchema, QtiMaterialSchema, QtiMaterialRefSchema, QtiResponseLidSchema, QtiResponseStrSchema]),
      )
      .min(1),
  }),
);

export const QtiPresentationSchema = z.union([
  strictObject({
    flow: QtiFlowSchema,
    label: z.string().optional(),
    xmlLang: z.string().optional(),
    x0: z.string().optional(),
    y0: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }),
  strictObject({
    children: z.array(z.union([QtiMaterialSchema, QtiResponseLidSchema, QtiResponseStrSchema])).min(1),
    label: z.string().optional(),
    xmlLang: z.string().optional(),
    x0: z.string().optional(),
    y0: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }),
]);

export const QtiPresentationMaterialSchema = strictObject({
  flow_mat: z.array(QtiFlowMatSchema).min(1),
});

export const QtiHintMaterialSchema = z.union([
  strictObject({
    flow_mat: z.array(QtiFlowMatSchema).min(1),
  }),
  strictObject({
    material: z.array(QtiMaterialSchema).min(1),
  }),
]);

export const QtiHintSchema = strictObject({
  kind: z.literal("hint"),
  feedbackstyle: z.literal("Complete").optional(),
  hintmaterial: z.array(QtiHintMaterialSchema).min(1),
});

export const QtiSolutionMaterialSchema = z.union([
  strictObject({
    flow_mat: z.array(QtiFlowMatSchema).min(1),
  }),
  strictObject({
    material: z.array(QtiMaterialSchema).min(1),
  }),
]);

export const QtiSolutionSchema = strictObject({
  kind: z.literal("solution"),
  feedbackstyle: z.literal("Complete").optional(),
  solutionmaterial: z.array(QtiSolutionMaterialSchema).min(1),
});

export const QtiItemFeedbackSchema = strictObject({
  ident: NonEmptyStringSchema,
  title: z.string().optional(),
  children: z.array(z.union([QtiFlowMatSchema, QtiMaterialSchema, QtiSolutionSchema, QtiHintSchema])).min(1),
});

export const QtiQtimetadatafieldSchema = strictObject({
  fieldlabel: NonEmptyStringSchema,
  fieldentry: z.string(),
  xmlLang: z.string().optional(),
});

export const QtiQtimetadataSchema = strictObject({
  qtimetadatafield: z.array(QtiQtimetadatafieldSchema).min(1),
});

export const QtiItemMetadataSchema = strictObject({
  qtimetadata: z.array(QtiQtimetadataSchema).min(1),
});

export const QtiRubricSchema = strictObject({
  material: QtiMaterialSchema,
});

export const QtiDecvarSchema = strictObject({
  value: z.string(),
  varname: z.literal("SCORE"),
  vartype: z.enum(["Decimal", "Integer"]).optional(),
  minvalue: z.string().optional(),
  maxvalue: z.string().optional(),
});

export const QtiDisplayFeedbackSchema = strictObject({
  value: z.string().optional(),
  feedbacktype: z.enum(["Response", "Solution", "Hint"]),
  linkrefid: NonEmptyStringSchema,
});

export const QtiSetVarSchema = strictObject({
  value: z.string(),
  varname: z.string().optional(),
  action: z.literal("Set").optional(),
});

export const QtiVarEqualSchema = strictObject({
  kind: z.literal("varequal"),
  value: z.string(),
  respident: NonEmptyStringSchema,
  case: YesNoSchema.optional(),
});

export const QtiVarSubstringSchema = strictObject({
  kind: z.literal("varsubstring"),
  value: z.string(),
  respident: NonEmptyStringSchema,
  case: YesNoSchema.optional(),
});

export const QtiOtherConditionSchema = strictObject({
  kind: z.literal("other"),
});

export const QtiNotSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("not"),
    tests: z.array(z.union([QtiAndSchema, QtiOrSchema, QtiVarEqualSchema])).min(1),
  }),
);

export const QtiAndSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("and"),
    tests: z.array(z.union([QtiNotSchema, QtiVarEqualSchema])).min(1),
  }),
);

export const QtiOrSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    kind: z.literal("or"),
    tests: z.array(z.union([QtiNotSchema, QtiVarEqualSchema])).min(1),
  }),
);

export const QtiConditionNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([QtiAndSchema, QtiOrSchema, QtiNotSchema, QtiOtherConditionSchema, QtiVarEqualSchema, QtiVarSubstringSchema]),
);

export const QtiConditionVarSchema = strictObject({
  tests: z.array(QtiConditionNodeSchema).min(1),
});

export const QtiRespConditionSchema = strictObject({
  title: z.string().optional(),
  continue: YesNoSchema.optional(),
  conditionvar: QtiConditionVarSchema,
  setvar: z.array(QtiSetVarSchema).optional(),
  displayfeedback: z.array(QtiDisplayFeedbackSchema).optional(),
});

export const QtiOutcomesSchema = strictObject({
  decvar: QtiDecvarSchema,
});

export const QtiResprocessingSchema = strictObject({
  outcomes: QtiOutcomesSchema,
  respcondition: z.array(QtiRespConditionSchema).min(1),
});

export const QtiItemSchema = strictObject({
  ident: NonEmptyStringSchema,
  title: z.string().optional(),
  xmlLang: z.string().optional(),
  itemmetadata: QtiItemMetadataSchema.optional(),
  presentation: QtiPresentationSchema.optional(),
  resprocessing: z.array(QtiResprocessingSchema).optional(),
  itemfeedback: z.array(QtiItemFeedbackSchema).optional(),
});

export const QtiSectionSchema = strictObject({
  ident: NonEmptyStringSchema,
  title: z.string().optional(),
  xmlLang: z.string().optional(),
  item: z.array(QtiItemSchema).min(1),
});

export const QtiAssessmentSchema = strictObject({
  ident: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  xmlLang: z.string().optional(),
  qtimetadata: QtiQtimetadataSchema.optional(),
  rubric: QtiRubricSchema.optional(),
  presentation_material: QtiPresentationMaterialSchema.optional(),
  section: QtiSectionSchema,
});

export const QtiObjectbankSchema = strictObject({
  ident: NonEmptyStringSchema,
  qtimetadata: QtiQtimetadataSchema.optional(),
  item: z.array(QtiItemSchema).min(1),
});

export const QtiQuestestinteropRawSchema = z.union([
  strictObject({
    assessment: QtiAssessmentSchema,
  }),
  strictObject({
    objectbank: QtiObjectbankSchema,
  }),
]);

const qtiAssessmentFieldRules: Record<string, z.ZodTypeAny> = {
  cc_profile: z.literal("cc.exam.v0p1"),
  qmd_assessmenttype: z.literal("Examination"),
  qmd_scoretype: z.literal("Percentage"),
  qmd_feedbackpermitted: z.enum(["Yes", "No"]),
  qmd_hintspermitted: z.enum(["Yes", "No"]),
  qmd_solutionspermitted: z.enum(["Yes", "No"]),
  qmd_timelimit: z.string().regex(/^[1-9]\d{0,5}$/u),
  cc_allow_late_submission: z.enum(["Yes", "No"]),
  cc_maxattempts: z.enum(["Examination", "1", "2", "3", "4", "5", "unlimited"]),
};

const qtiItemFieldRules: Record<string, z.ZodTypeAny> = {
  cc_profile: z.enum([
    "cc.multiple_choice.v0p1",
    "cc.multiple_response.v0p1",
    "cc.true_false.v0p1",
    "cc.fib.v0p1",
    "cc.pattern_match.v0p1",
    "cc.essay.v0p1",
  ]),
  cc_question_category: z.string(),
  cc_weighting: z.string().regex(/^[1-9]\d?$/u),
  qmd_scoringpermitted: z.literal("Yes"),
  qmd_computerscored: z.enum(["Yes", "No"]),
};

type QtiMetadataFieldEntry = {
  fieldlabel: string;
  fieldentry: string;
};

type QtiMetadataLike = {
  qtimetadatafield?: QtiMetadataFieldEntry[];
};

type QtiItemMetadataLike = {
  itemmetadata?: {
    qtimetadata?: QtiMetadataLike[];
  };
};

type QtiRenderLike = {
  kind?: "render_choice" | "render_fib";
  children?: Array<{ kind?: string }>;
};

type QtiPresentationNodeLike = {
  kind?: string;
  children?: QtiPresentationNodeLike[];
  ident?: string;
  rcardinality?: "Single" | "Multiple" | "Ordered";
  render?: QtiRenderLike;
};

type QtiPresentationLike = { flow: QtiPresentationNodeLike } | { children?: QtiPresentationNodeLike[] };

type QtiConditionNodeLike = {
  kind?: string;
  tests?: QtiConditionNodeLike[];
  respident?: string;
};

type QtiDisplayFeedbackLike = {
  feedbacktype: "Response" | "Solution" | "Hint";
  linkrefid: string;
};

type QtiItemFeedbackLike = {
  ident: string;
  children?: Array<{ kind?: string }>;
};

type QtiResprocessingLike = {
  respcondition?: Array<{
    conditionvar?: {
      tests?: QtiConditionNodeLike[];
    };
    displayfeedback?: QtiDisplayFeedbackLike[];
  }>;
};

type QtiItemLike = QtiItemMetadataLike & {
  ident: string;
  presentation?: QtiPresentationLike;
  resprocessing?: QtiResprocessingLike[];
  itemfeedback?: QtiItemFeedbackLike[];
};

function flattenQtiMetadata(
  qtimetadata: QtiMetadataLike | undefined,
): Array<{ fieldlabel: string; fieldentry: string }> {
  return asArray(qtimetadata?.qtimetadatafield).map((field) => ({
    fieldlabel: field.fieldlabel,
    fieldentry: field.fieldentry,
  }));
}

function flattenQtiItemMetadata(item: QtiItemMetadataLike): Array<{ fieldlabel: string; fieldentry: string }> {
  return asArray(item.itemmetadata?.qtimetadata).flatMap((metadata) => flattenQtiMetadata(metadata));
}

function getQtiMetadataValues(fields: Array<{ fieldlabel: string; fieldentry: string }>, label: string): string[] {
  return fields.filter((field) => field.fieldlabel === label).map((field) => field.fieldentry);
}

function validateControlledMetadata(
  fields: Array<{ fieldlabel: string; fieldentry: string }>,
  rules: Record<string, z.ZodTypeAny>,
  requiredExactlyOnceLabels: string[],
  context: z.RefinementCtx,
  path: Array<string | number>,
) {
  const allowedLabels = new Set(Object.keys(rules));

  fields.forEach((field, index) => {
    if (!allowedLabels.has(field.fieldlabel)) {
      addIssue(context, [...path, index, "fieldlabel"], `Unexpected metadata fieldlabel: ${field.fieldlabel}`);
      return;
    }

    const rule = rules[field.fieldlabel];
    if (!rule) {
      addIssue(
        context,
        [...path, index, "fieldlabel"],
        `Missing validation rule for metadata fieldlabel: ${field.fieldlabel}`,
      );
      return;
    }
    const result = rule.safeParse(field.fieldentry);
    if (!result.success) {
      addIssue(
        context,
        [...path, index, "fieldentry"],
        `Invalid value ${JSON.stringify(field.fieldentry)} for metadata fieldlabel ${field.fieldlabel}`,
      );
    }
  });

  for (const label of allowedLabels) {
    const values = getQtiMetadataValues(fields, label);
    if (requiredExactlyOnceLabels.includes(label)) {
      if (values.length !== 1) {
        addIssue(
          context,
          path,
          `Metadata fieldlabel ${label} must occur exactly once when its metadata container is present.`,
        );
      }
      continue;
    }

    if (values.length > 1) {
      addIssue(context, path, `Metadata fieldlabel ${label} must not occur more than once.`);
    }
  }
}

function visitQtiPresentationNode(node: QtiPresentationNodeLike, visit: (candidate: QtiPresentationNodeLike) => void) {
  visit(node);

  if (node.kind === "flow" || node.kind === "flow_mat" || node.kind === "flow_label") {
    for (const child of asArray(node.children)) {
      visitQtiPresentationNode(child, visit);
    }
  }
}

function collectQtiResponsesFromPresentation(presentation: QtiPresentationLike | undefined): {
  responseLid: QtiPresentationNodeLike[];
  responseStr: QtiPresentationNodeLike[];
} {
  const responseLid: QtiPresentationNodeLike[] = [];
  const responseStr: QtiPresentationNodeLike[] = [];

  if (!presentation) {
    return { responseLid, responseStr };
  }

  const nodes = "flow" in presentation ? [presentation.flow] : asArray(presentation.children);

  for (const node of nodes) {
    visitQtiPresentationNode(node, (candidate) => {
      if (candidate?.kind === "response_lid") {
        responseLid.push(candidate);
      }
      if (candidate?.kind === "response_str") {
        responseStr.push(candidate);
      }
    });
  }

  return { responseLid, responseStr };
}

function visitQtiConditionNode(node: QtiConditionNodeLike, visit: (candidate: QtiConditionNodeLike) => void) {
  visit(node);
  if (node.kind === "and" || node.kind === "or" || node.kind === "not") {
    for (const child of asArray(node.tests)) {
      visitQtiConditionNode(child, visit);
    }
  }
}

function collectQtiConditionNodes(item: QtiItemLike, kind: string): QtiConditionNodeLike[] {
  const matches: QtiConditionNodeLike[] = [];

  for (const resprocessing of asArray(item.resprocessing)) {
    for (const respcondition of asArray(resprocessing.respcondition)) {
      for (const node of asArray(respcondition.conditionvar?.tests)) {
        visitQtiConditionNode(node, (candidate) => {
          if (candidate.kind === kind) {
            matches.push(candidate);
          }
        });
      }
    }
  }

  return matches;
}

function collectQtiDisplayFeedback(item: QtiItemLike): QtiDisplayFeedbackLike[] {
  return asArray(item.resprocessing).flatMap((resprocessing) =>
    asArray(resprocessing.respcondition).flatMap((respcondition) => asArray(respcondition.displayfeedback)),
  );
}

function countQtiResponseLabels(response: QtiPresentationNodeLike | undefined): number {
  if (response?.render?.kind === "render_choice") {
    return asArray(response.render.children).filter((child) => child.kind === "response_label").length;
  }

  return 0;
}

function renderKindIs(response: QtiPresentationNodeLike | undefined, kind: "render_choice" | "render_fib"): boolean {
  return response?.render?.kind === kind;
}

function validateQtiItemByProfile(item: QtiItemLike, context: z.RefinementCtx, path: Array<string | number>) {
  const fields = flattenQtiItemMetadata(item);
  const profile = getQtiMetadataValues(fields, "cc_profile")[0];

  if (!profile) {
    return;
  }

  const responses = collectQtiResponsesFromPresentation(item.presentation);
  const firstResponseLid = responses.responseLid[0];
  const firstResponseStr = responses.responseStr[0];
  const varequals = collectQtiConditionNodes(item, "varequal");
  const varsubstrings = collectQtiConditionNodes(item, "varsubstring");

  if (profile === "cc.true_false.v0p1") {
    if (!firstResponseLid || firstResponseLid.rcardinality !== "Single") {
      addIssue(
        context,
        [...path, "presentation"],
        "True/False items must use response_lid with rcardinality='Single'.",
      );
    }
    if (responses.responseStr.length > 0) {
      addIssue(context, [...path, "presentation"], "True/False items must not use response_str.");
    }
    if (firstResponseLid && renderKindIs(firstResponseLid, "render_fib")) {
      addIssue(context, [...path, "presentation"], "True/False items must not use render_fib.");
    }
    if (firstResponseLid && countQtiResponseLabels(firstResponseLid) !== 2) {
      addIssue(context, [...path, "presentation"], "True/False items must expose exactly two response_label entries.");
    }
    if (firstResponseLid && varequals.some((candidate) => candidate.respident !== firstResponseLid.ident)) {
      addIssue(
        context,
        [...path, "resprocessing"],
        "True/False varequal/@respident values must match response_lid/@ident.",
      );
    }
    if (varsubstrings.length > 0) {
      addIssue(context, [...path, "resprocessing"], "True/False items must not use varsubstring.");
    }
  }

  if (profile === "cc.multiple_choice.v0p1") {
    if (!firstResponseLid || firstResponseLid.rcardinality !== "Single") {
      addIssue(
        context,
        [...path, "presentation"],
        "Single-response multiple choice items must use response_lid with rcardinality='Single'.",
      );
    }
    if (responses.responseStr.length > 0) {
      addIssue(context, [...path, "presentation"], "Single-response multiple choice items must not use response_str.");
    }
    if (firstResponseLid && renderKindIs(firstResponseLid, "render_fib")) {
      addIssue(context, [...path, "presentation"], "Single-response multiple choice items must not use render_fib.");
    }
    if (firstResponseLid && countQtiResponseLabels(firstResponseLid) <= 1) {
      addIssue(
        context,
        [...path, "presentation"],
        "Single-response multiple choice items must expose more than one response_label.",
      );
    }
    if (firstResponseLid && varequals.some((candidate) => candidate.respident !== firstResponseLid.ident)) {
      addIssue(
        context,
        [...path, "resprocessing"],
        "Multiple choice varequal/@respident values must match response_lid/@ident.",
      );
    }
    if (varsubstrings.length > 0) {
      addIssue(context, [...path, "resprocessing"], "Multiple choice items must not use varsubstring.");
    }
  }

  if (profile === "cc.multiple_response.v0p1") {
    if (!firstResponseLid || firstResponseLid.rcardinality !== "Multiple") {
      addIssue(
        context,
        [...path, "presentation"],
        "Multiple-response items must use response_lid with rcardinality='Multiple'.",
      );
    }
    if (responses.responseStr.length > 0) {
      addIssue(context, [...path, "presentation"], "Multiple-response items must not use response_str.");
    }
    if (firstResponseLid && renderKindIs(firstResponseLid, "render_fib")) {
      addIssue(context, [...path, "presentation"], "Multiple-response items must not use render_fib.");
    }
    if (firstResponseLid && countQtiResponseLabels(firstResponseLid) <= 1) {
      addIssue(context, [...path, "presentation"], "Multiple-response items must expose more than one response_label.");
    }
    if (firstResponseLid && varequals.some((candidate) => candidate.respident !== firstResponseLid.ident)) {
      addIssue(
        context,
        [...path, "resprocessing"],
        "Multiple-response varequal/@respident values must match response_lid/@ident.",
      );
    }
    if (varsubstrings.length > 0) {
      addIssue(context, [...path, "resprocessing"], "Multiple-response items must not use varsubstring.");
    }
  }

  if (profile === "cc.fib.v0p1") {
    if (responses.responseLid.length > 0) {
      addIssue(context, [...path, "presentation"], "Fill-in-the-blank items must not use response_lid.");
    }
    if (firstResponseStr && renderKindIs(firstResponseStr, "render_choice")) {
      addIssue(context, [...path, "presentation"], "Fill-in-the-blank items must not use render_choice.");
    }
    if (firstResponseStr && varequals.some((candidate) => candidate.respident !== firstResponseStr.ident)) {
      addIssue(
        context,
        [...path, "resprocessing"],
        "Fill-in-the-blank varequal/@respident values must match response_str/@ident.",
      );
    }
    if (varsubstrings.length > 0) {
      addIssue(context, [...path, "resprocessing"], "Fill-in-the-blank items must not use varsubstring.");
    }
  }

  if (profile === "cc.pattern_match.v0p1") {
    if (responses.responseLid.length > 0) {
      addIssue(context, [...path, "presentation"], "Pattern-match items must not use response_lid.");
    }
    if (firstResponseStr && renderKindIs(firstResponseStr, "render_choice")) {
      addIssue(context, [...path, "presentation"], "Pattern-match items must not use render_choice.");
    }
    if (firstResponseStr && varequals.some((candidate) => candidate.respident !== firstResponseStr.ident)) {
      addIssue(
        context,
        [...path, "resprocessing"],
        "Pattern-match varequal/@respident values must match response_str/@ident.",
      );
    }
  }

  if (profile === "cc.essay.v0p1") {
    if (responses.responseLid.length > 0) {
      addIssue(context, [...path, "presentation"], "Essay items must not use response_lid.");
    }
    if (firstResponseStr && renderKindIs(firstResponseStr, "render_choice")) {
      addIssue(context, [...path, "presentation"], "Essay items must not use render_choice.");
    }
    if (varequals.length > 0) {
      addIssue(context, [...path, "resprocessing"], "Essay items must not use varequal.");
    }
    if (varsubstrings.length > 0) {
      addIssue(context, [...path, "resprocessing"], "Essay items must not use varsubstring.");
    }
    const solutionCount = asArray(item.itemfeedback)
      .flatMap((feedback) => asArray(feedback.children))
      .filter((child) => child.kind === "solution").length;
    if (solutionCount > 1) {
      addIssue(
        context,
        [...path, "itemfeedback"],
        "Essay items must not contain more than one solution feedback block.",
      );
    }
    const computerScoredValue = getQtiMetadataValues(fields, "qmd_computerscored")[0];
    if (computerScoredValue !== "No") {
      addIssue(context, [...path, "itemmetadata"], "Essay items must declare qmd_computerscored='No'.");
    }
  }
}

function validateQtiFeedbackLinkage(item: QtiItemLike, context: z.RefinementCtx, path: Array<string | number>) {
  const displayFeedback = collectQtiDisplayFeedback(item);
  const feedbackIds = new Set(asArray(item.itemfeedback).map((feedback) => feedback.ident));

  const hasHintTrigger = displayFeedback.some((entry) => entry.feedbacktype === "Hint");
  const hasSolutionTrigger = displayFeedback.some((entry) => entry.feedbacktype === "Solution");

  if (hasHintTrigger) {
    const hintCount = asArray(item.itemfeedback).filter((feedback) => feedback.ident === "hint").length;
    if (hintCount !== 1) {
      addIssue(
        context,
        [...path, "itemfeedback"],
        "Hint feedback triggers require exactly one itemfeedback with ident='hint'.",
      );
    }
  }

  if (hasSolutionTrigger) {
    const solutionCount = asArray(item.itemfeedback).filter((feedback) => feedback.ident === "solution").length;
    if (solutionCount !== 1) {
      addIssue(
        context,
        [...path, "itemfeedback"],
        "Solution feedback triggers require exactly one itemfeedback with ident='solution'.",
      );
    }
  }

  displayFeedback.forEach((entry, entryIndex) => {
    if (entry.feedbacktype === "Response" && ["hint", "solution"].includes(entry.linkrefid)) {
      addIssue(
        context,
        [...path, "resprocessing", entryIndex, "displayfeedback", "linkrefid"],
        "Response feedback must not point at hint or solution identifiers.",
      );
    }

    if (entry.feedbacktype === "Response" && !feedbackIds.has(entry.linkrefid)) {
      addIssue(
        context,
        [...path, "resprocessing", entryIndex, "displayfeedback", "linkrefid"],
        `displayfeedback linkrefid ${entry.linkrefid} does not match any itemfeedback/@ident.`,
      );
    }
  });

  asArray(item.itemfeedback).forEach((feedback, feedbackIndex) => {
    const kinds = asArray(feedback.children).map((child) => child.kind);

    if (feedback.ident === "hint") {
      if (kinds.includes("solution")) {
        addIssue(
          context,
          [...path, "itemfeedback", feedbackIndex],
          "itemfeedback ident='hint' must not contain solution content.",
        );
      }
      if (kinds.includes("flow_mat")) {
        addIssue(
          context,
          [...path, "itemfeedback", feedbackIndex],
          "itemfeedback ident='hint' must not contain direct response feedback flow_mat content.",
        );
      }
    }

    if (feedback.ident === "solution") {
      if (kinds.includes("hint")) {
        addIssue(
          context,
          [...path, "itemfeedback", feedbackIndex],
          "itemfeedback ident='solution' must not contain hint content.",
        );
      }
      if (kinds.includes("flow_mat")) {
        addIssue(
          context,
          [...path, "itemfeedback", feedbackIndex],
          "itemfeedback ident='solution' must not contain direct response feedback flow_mat content.",
        );
      }
    }

    if (kinds.includes("flow_mat")) {
      const hasResponseTrigger = displayFeedback.some(
        (entry) => entry.feedbacktype === "Response" && entry.linkrefid === feedback.ident,
      );
      if (!hasResponseTrigger) {
        addIssue(
          context,
          [...path, "itemfeedback", feedbackIndex],
          `Response feedback block ${feedback.ident} does not have a matching displayfeedback trigger.`,
        );
      }
    }
  });
}

export const QtiQuestestinteropProfileSchema = QtiQuestestinteropRawSchema.superRefine((root, context) => {
  if ("assessment" in root) {
    const assessmentFields = flattenQtiMetadata(root.assessment.qtimetadata);
    if (assessmentFields.length > 0) {
      validateControlledMetadata(assessmentFields, qtiAssessmentFieldRules, ["cc_profile"], context, [
        "assessment",
        "qtimetadata",
        "qtimetadatafield",
      ]);
    }

    const itemIds = asArray(root.assessment.section.item).map((item) => item.ident);
    for (const duplicate of collectDuplicates(itemIds)) {
      addIssue(context, ["assessment", "section", "item"], `Duplicate item ident in assessment section: ${duplicate}`);
    }

    asArray(root.assessment.section.item).forEach((item, itemIndex) => {
      const fields = flattenQtiItemMetadata(item);
      if (fields.length > 0) {
        validateControlledMetadata(fields, qtiItemFieldRules, ["cc_profile"], context, [
          "assessment",
          "section",
          "item",
          itemIndex,
          "itemmetadata",
          "qtimetadata",
        ]);
      }
      validateQtiItemByProfile(item as QtiItemLike, context, ["assessment", "section", "item", itemIndex]);
      validateQtiFeedbackLinkage(item as QtiItemLike, context, ["assessment", "section", "item", itemIndex]);
    });
  }

  if ("objectbank" in root) {
    const itemIds = asArray(root.objectbank.item).map((item) => item.ident);
    for (const duplicate of collectDuplicates(itemIds)) {
      addIssue(context, ["objectbank", "item"], `Duplicate item ident in object bank: ${duplicate}`);
    }

    asArray(root.objectbank.item).forEach((item, itemIndex) => {
      const fields = flattenQtiItemMetadata(item);
      if (fields.length > 0) {
        validateControlledMetadata(fields, qtiItemFieldRules, ["cc_profile"], context, [
          "objectbank",
          "item",
          itemIndex,
          "itemmetadata",
          "qtimetadata",
        ]);
      }
      validateQtiItemByProfile(item as QtiItemLike, context, ["objectbank", "item", itemIndex]);
      validateQtiFeedbackLinkage(item as QtiItemLike, context, ["objectbank", "item", itemIndex]);
    });
  }
});

export const QtiQuestestinteropRawDocumentSchema = strictObject({
  questestinterop: QtiQuestestinteropRawSchema,
});

export const QtiQuestestinteropProfileDocumentSchema = strictObject({
  questestinterop: QtiQuestestinteropProfileSchema,
});
// Inferred types from exported Zod validators.
export type QtiMatText = z.infer<typeof QtiMatTextSchema>;
export type QtiMatRef = z.infer<typeof QtiMatRefSchema>;
export type QtiMatBreak = z.infer<typeof QtiMatBreakSchema>;
export type QtiMaterialRef = z.infer<typeof QtiMaterialRefSchema>;
export type QtiMaterialChild = z.infer<typeof QtiMaterialChildSchema>;
export type QtiAltMaterial = z.infer<typeof QtiAltMaterialSchema>;
export type QtiMaterial = z.infer<typeof QtiMaterialSchema>;
export type QtiResponseLabel = z.infer<typeof QtiResponseLabelSchema>;
export type QtiRenderChoice = z.infer<typeof QtiRenderChoiceSchema>;
export type QtiRenderFib = z.infer<typeof QtiRenderFibSchema>;
export type QtiResponseLid = z.infer<typeof QtiResponseLidSchema>;
export type QtiResponseStr = z.infer<typeof QtiResponseStrSchema>;
export type QtiPresentation = z.infer<typeof QtiPresentationSchema>;
export type QtiPresentationMaterial = z.infer<typeof QtiPresentationMaterialSchema>;
export type QtiHintMaterial = z.infer<typeof QtiHintMaterialSchema>;
export type QtiHint = z.infer<typeof QtiHintSchema>;
export type QtiSolutionMaterial = z.infer<typeof QtiSolutionMaterialSchema>;
export type QtiSolution = z.infer<typeof QtiSolutionSchema>;
export type QtiItemFeedback = z.infer<typeof QtiItemFeedbackSchema>;
export type QtiQtimetadatafield = z.infer<typeof QtiQtimetadatafieldSchema>;
export type QtiQtimetadata = z.infer<typeof QtiQtimetadataSchema>;
export type QtiItemMetadata = z.infer<typeof QtiItemMetadataSchema>;
export type QtiRubric = z.infer<typeof QtiRubricSchema>;
export type QtiDecvar = z.infer<typeof QtiDecvarSchema>;
export type QtiDisplayFeedback = z.infer<typeof QtiDisplayFeedbackSchema>;
export type QtiSetVar = z.infer<typeof QtiSetVarSchema>;
export type QtiVarEqual = z.infer<typeof QtiVarEqualSchema>;
export type QtiVarSubstring = z.infer<typeof QtiVarSubstringSchema>;
export type QtiOtherCondition = z.infer<typeof QtiOtherConditionSchema>;
export type QtiConditionVar = z.infer<typeof QtiConditionVarSchema>;
export type QtiRespCondition = z.infer<typeof QtiRespConditionSchema>;
export type QtiOutcomes = z.infer<typeof QtiOutcomesSchema>;
export type QtiResprocessing = z.infer<typeof QtiResprocessingSchema>;
export type QtiItem = z.infer<typeof QtiItemSchema>;
export type QtiSection = z.infer<typeof QtiSectionSchema>;
export type QtiAssessment = z.infer<typeof QtiAssessmentSchema>;
export type QtiObjectbank = z.infer<typeof QtiObjectbankSchema>;
export type QtiQuestestinteropRaw = z.infer<typeof QtiQuestestinteropRawSchema>;
export type QtiQuestestinteropProfile = z.infer<typeof QtiQuestestinteropProfileSchema>;
export type QtiQuestestinteropRawDocument = z.infer<typeof QtiQuestestinteropRawDocumentSchema>;
export type QtiQuestestinteropProfileDocument = z.infer<typeof QtiQuestestinteropProfileDocumentSchema>;
