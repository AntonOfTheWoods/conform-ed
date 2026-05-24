import { z } from "zod";

export type Qti2Config = {
  includeAssessmentStimulus: boolean;
  includeExternalSupplementalAccessibility: boolean;
  includeScoringModes: boolean;
  manifestSchemaValues: readonly string[];
  manifestResourceTypes: readonly string[];
};

export const NonEmptyStringSchema = z.string().min(1);
export const UriReferenceSchema = NonEmptyStringSchema;
export const QtiIdentifierSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9._-]*$/u);
export const QtiBaseTypeSchema = z.enum([
  "boolean",
  "directedPair",
  "duration",
  "file",
  "float",
  "identifier",
  "integer",
  "pair",
  "point",
  "string",
  "uri",
]);
export const QtiCardinalitySchema = z.enum(["single", "multiple", "ordered", "record"]);
export const QtiViewSchema = z.enum(["author", "candidate", "proctor", "scorer", "testConstructor", "tutor"]);
export const QtiShowHideSchema = z.enum(["show", "hide"]);
export const QtiOrientationSchema = z.enum(["horizontal", "vertical"]);
export const QtiNavigationModeSchema = z.enum(["linear", "nonlinear"]);
export const QtiSubmissionModeSchema = z.enum(["individual", "simultaneous"]);
export const QtiSessionStatusSchema = z.enum([
  "final",
  "initial",
  "pendingExternalScoring",
  "pendingResponseProcessing",
  "pendingSubmission",
]);
export const QtiFeedbackTypeSchema = z.enum(["adaptive", "nonadaptive", "none"]);
export const QtiScoringModeSchema = z.enum(["human", "externalmachine", "responseprocessing"]);
export const XmlForeignAttributesSchema = z.record(z.string(), z.unknown());

export const XmlExtensionNodeSchema = z
  .object({
    namespace: NonEmptyStringSchema,
    name: NonEmptyStringSchema,
    value: z.unknown().optional(),
    attributes: XmlForeignAttributesSchema.optional(),
    children: z.array(z.unknown()).optional(),
  })
  .strict();

export const XmlExtensionNodeListSchema = z.array(XmlExtensionNodeSchema);

export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export function looseObject<T extends z.ZodRawShape>(shape: T) {
  return strictObject({
    ...shape,
    extensions: XmlExtensionNodeListSchema.optional(),
    foreignAttributes: XmlForeignAttributesSchema.optional(),
  });
}

export function addIssue(context: z.RefinementCtx, path: Array<string | number>, message: string) {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

export function collectDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }

    seen.add(value);
  }

  return [...duplicates];
}

export function asArray<T>(value: readonly T[] | T[] | undefined | null): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function uniqueIdentifiersRefinement(
  values: Array<{ identifier: string }>,
  path: Array<string | number>,
  label: string,
  context: z.RefinementCtx,
) {
  for (const duplicate of collectDuplicates(values.map((value) => value.identifier))) {
    addIssue(context, path, `Duplicate ${label} identifier "${duplicate}"`);
  }
}

function validateDeclaredValues(
  cardinality: z.infer<typeof QtiCardinalitySchema>,
  baseType: z.infer<typeof QtiBaseTypeSchema> | undefined,
  values: Array<{ fieldIdentifier?: string }>,
  path: Array<string | number>,
  context: z.RefinementCtx,
) {
  if (cardinality === "record") {
    if (baseType) {
      addIssue(context, path, "Record cardinality variables must not declare baseType");
    }

    values.forEach((value, index) => {
      if (!value.fieldIdentifier) {
        addIssue(context, [...path, index], "Record cardinality values require fieldIdentifier");
      }
    });

    return;
  }

  if (!baseType) {
    addIssue(context, path, "Non-record variables must declare baseType");
  }
}

export function createQti2Schemas(config: Qti2Config) {
  const ManifestSchemaValueSchema = z.string().refine((value) => config.manifestSchemaValues.includes(value), {
    message: `Expected one of: ${config.manifestSchemaValues.join(", ")}`,
  });

  const ManifestResourceTypeSchema = z.string().refine((value) => config.manifestResourceTypes.includes(value), {
    message: `Expected one of: ${config.manifestResourceTypes.join(", ")}`,
  });

  const QtiTextNodeSchema = strictObject({
    kind: z.literal("text"),
    value: z.string(),
  });

  const QtiContentNodeSchema: z.ZodTypeAny = z.lazy(() =>
    z.union([
      QtiTextNodeSchema,
      looseObject({
        kind: NonEmptyStringSchema.refine((value) => value !== "text", {
          message: 'Element node kind must not be "text"',
        }),
        value: z.string().optional(),
        attributes: XmlForeignAttributesSchema.optional(),
        children: z.array(QtiContentNodeSchema).optional(),
      }),
    ]),
  );

  const QtiStylesheetSchema = strictObject({
    href: UriReferenceSchema,
    type: NonEmptyStringSchema.optional(),
    media: NonEmptyStringSchema.optional(),
    title: NonEmptyStringSchema.optional(),
  });

  const QtiValueSchema = strictObject({
    value: z.string(),
    fieldIdentifier: QtiIdentifierSchema.optional(),
    baseType: QtiBaseTypeSchema.optional(),
  });

  const QtiDefaultValueSchema = strictObject({
    values: z.array(QtiValueSchema).min(1),
  });

  const QtiCorrectResponseSchema = strictObject({
    values: z.array(QtiValueSchema).min(1),
    interpretation: z.string().optional(),
  });

  const QtiMapEntrySchema = strictObject({
    mapKey: z.string(),
    mappedValue: z.number(),
    caseSensitive: z.boolean().optional(),
  });

  const QtiMappingSchema = strictObject({
    lowerBound: z.number().optional(),
    upperBound: z.number().optional(),
    defaultValue: z.number().optional(),
    entries: z.array(QtiMapEntrySchema).min(1),
  });

  const QtiAreaMapEntrySchema = strictObject({
    shape: NonEmptyStringSchema.optional(),
    coords: NonEmptyStringSchema.optional(),
    mappedValue: z.number(),
    caseSensitive: z.boolean().optional(),
  });

  const QtiAreaMappingSchema = strictObject({
    lowerBound: z.number().optional(),
    upperBound: z.number().optional(),
    defaultValue: z.number().optional(),
    entries: z.array(QtiAreaMapEntrySchema).min(1),
  });

  const QtiMatchTableEntrySchema = strictObject({
    sourceValue: z.string(),
    targetValue: z.string(),
  });

  const QtiMatchTableSchema = strictObject({
    defaultValue: z.string().optional(),
    entries: z.array(QtiMatchTableEntrySchema).min(1),
  });

  const QtiInterpolationTableEntrySchema = strictObject({
    sourceValue: z.number(),
    targetValue: z.string(),
    includeBoundary: z.boolean().optional(),
  });

  const QtiInterpolationTableSchema = strictObject({
    defaultValue: z.string().optional(),
    entries: z.array(QtiInterpolationTableEntrySchema).min(1),
  });

  const QtiResponseDeclarationRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    defaultValue: QtiDefaultValueSchema.optional(),
    correctResponse: QtiCorrectResponseSchema.optional(),
    mapping: QtiMappingSchema.optional(),
    areaMapping: QtiAreaMappingSchema.optional(),
  });

  const QtiResponseDeclarationSchema = QtiResponseDeclarationRawSchema.superRefine((value, context) => {
    validateDeclaredValues(
      value.cardinality,
      value.baseType,
      value.defaultValue?.values ?? value.correctResponse?.values ?? [],
      [],
      context,
    );
  });

  const QtiOutcomeDeclarationRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    defaultValue: QtiDefaultValueSchema.optional(),
    matchTable: QtiMatchTableSchema.optional(),
    interpolationTable: QtiInterpolationTableSchema.optional(),
    view: QtiViewSchema.optional(),
    interpretation: z.string().optional(),
    longInterpretation: UriReferenceSchema.optional(),
    normalMaximum: z.number().optional(),
    normalMinimum: z.number().optional(),
    masteryValue: z.number().optional(),
    externalScored: z.enum(["human", "externalMachine"]).optional(),
  });

  const QtiOutcomeDeclarationSchema = QtiOutcomeDeclarationRawSchema.superRefine((value, context) => {
    validateDeclaredValues(value.cardinality, value.baseType, value.defaultValue?.values ?? [], [], context);
  });

  const QtiTemplateDeclarationRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    defaultValue: QtiDefaultValueSchema.optional(),
    paramVariable: z.boolean().optional(),
    mathVariable: z.boolean().optional(),
  });

  const QtiTemplateDeclarationSchema = QtiTemplateDeclarationRawSchema.superRefine((value, context) => {
    validateDeclaredValues(value.cardinality, value.baseType, value.defaultValue?.values ?? [], [], context);
  });

  const QtiPromptSchema = strictObject({
    kind: z.literal("prompt"),
    children: z.array(QtiContentNodeSchema).min(1),
  });

  const QtiInlineChoiceSchema = strictObject({
    kind: z.literal("inlineChoice"),
    identifier: QtiIdentifierSchema,
    fixed: z.boolean().optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiSimpleChoiceSchema = strictObject({
    kind: z.literal("simpleChoice"),
    identifier: QtiIdentifierSchema,
    fixed: z.boolean().optional(),
    showHide: QtiShowHideSchema.optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiSimpleAssociableChoiceSchema = strictObject({
    kind: z.literal("simpleAssociableChoice"),
    identifier: QtiIdentifierSchema,
    matchMax: z.number().int().optional(),
    matchGroup: z.array(NonEmptyStringSchema).optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiHotspotChoiceSchema = strictObject({
    kind: z.literal("hotspotChoice"),
    identifier: QtiIdentifierSchema,
    shape: NonEmptyStringSchema.optional(),
    coords: NonEmptyStringSchema.optional(),
    fixed: z.boolean().optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiAssociableHotspotSchema = strictObject({
    kind: z.literal("associableHotspot"),
    identifier: QtiIdentifierSchema,
    shape: NonEmptyStringSchema.optional(),
    coords: NonEmptyStringSchema.optional(),
    matchMax: z.number().int().optional(),
  });

  const QtiGapTextSchema = strictObject({
    kind: z.literal("gapText"),
    identifier: QtiIdentifierSchema,
    matchMax: z.number().int().optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiGapImgSchema = strictObject({
    kind: z.literal("gapImg"),
    identifier: QtiIdentifierSchema,
    matchMax: z.number().int().optional(),
    src: UriReferenceSchema.optional(),
    alt: z.string().optional(),
  });

  const QtiGapSchema = strictObject({
    kind: z.literal("gap"),
    identifier: QtiIdentifierSchema,
    matchMax: z.number().int().optional(),
  });

  const QtiSimpleMatchSetSchema = strictObject({
    kind: z.literal("simpleMatchSet"),
    choices: z.array(z.union([QtiSimpleAssociableChoiceSchema, QtiSimpleChoiceSchema])).min(1),
  });

  const QtiInteractionBaseShape = {
    responseIdentifier: QtiIdentifierSchema.optional(),
    title: z.string().optional(),
    label: z.string().optional(),
    maxChoices: z.number().int().optional(),
    minChoices: z.number().int().optional(),
    maxStrings: z.number().int().optional(),
    minStrings: z.number().int().optional(),
    maxAssociations: z.number().int().optional(),
    minAssociations: z.number().int().optional(),
    maxPlays: z.number().int().optional(),
    minAssociationsPerChoice: z.number().int().optional(),
    shuffle: z.boolean().optional(),
    fixed: z.boolean().optional(),
    orientation: QtiOrientationSchema.optional(),
    expectedLength: z.number().int().optional(),
    patternMask: z.string().optional(),
    placeholderText: z.string().optional(),
    step: z.number().optional(),
    lowerBound: z.number().optional(),
    upperBound: z.number().optional(),
    attrs: XmlForeignAttributesSchema.optional(),
    prompt: QtiPromptSchema.optional(),
  } satisfies z.ZodRawShape;

  const QtiChoiceInteractionSchema = strictObject({
    kind: z.literal("choiceInteraction"),
    ...QtiInteractionBaseShape,
    simpleChoices: z.array(QtiSimpleChoiceSchema).min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.simpleChoices, ["simpleChoices"], "simple choice", context);
  });

  const QtiOrderInteractionSchema = strictObject({
    kind: z.literal("orderInteraction"),
    ...QtiInteractionBaseShape,
    simpleChoices: z.array(QtiSimpleChoiceSchema).min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.simpleChoices, ["simpleChoices"], "simple choice", context);
  });

  const QtiAssociateInteractionSchema = strictObject({
    kind: z.literal("associateInteraction"),
    ...QtiInteractionBaseShape,
    simpleAssociableChoices: z.array(QtiSimpleAssociableChoiceSchema).min(2),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(
      value.simpleAssociableChoices,
      ["simpleAssociableChoices"],
      "associable choice",
      context,
    );
  });

  const QtiMatchInteractionSchema = strictObject({
    kind: z.literal("matchInteraction"),
    ...QtiInteractionBaseShape,
    simpleMatchSets: z.array(QtiSimpleMatchSetSchema).min(2),
  });

  const QtiInlineChoiceInteractionSchema = strictObject({
    kind: z.literal("inlineChoiceInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    inlineChoices: z.array(QtiInlineChoiceSchema).min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.inlineChoices, ["inlineChoices"], "inline choice", context);
  });

  const QtiTextEntryInteractionSchema = strictObject({
    kind: z.literal("textEntryInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
  });

  const QtiExtendedTextInteractionSchema = strictObject({
    kind: z.literal("extendedTextInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    expectedLines: z.number().int().optional(),
  });

  const QtiUploadInteractionSchema = strictObject({
    kind: z.literal("uploadInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    type: z.string().optional(),
  });

  const QtiHottextInteractionSchema = strictObject({
    kind: z.literal("hottextInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    hottexts: z
      .array(
        strictObject({
          kind: z.literal("hottext"),
          identifier: QtiIdentifierSchema,
          fixed: z.boolean().optional(),
          children: z.array(QtiContentNodeSchema).optional(),
        }),
      )
      .min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.hottexts, ["hottexts"], "hottext", context);
  });

  const QtiGapMatchInteractionSchema = strictObject({
    kind: z.literal("gapMatchInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    gapTexts: z.array(QtiGapTextSchema).optional(),
    gapImgs: z.array(QtiGapImgSchema).optional(),
    gaps: z.array(QtiGapSchema).optional(),
  });

  const QtiGraphicGapMatchInteractionSchema = strictObject({
    kind: z.literal("graphicGapMatchInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    gapTexts: z.array(QtiGapTextSchema).optional(),
    gapImgs: z.array(QtiGapImgSchema).optional(),
    hotspots: z.array(QtiGapSchema).optional(),
    object: QtiContentNodeSchema.optional(),
  });

  const QtiHotspotInteractionSchema = strictObject({
    kind: z.literal("hotspotInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    hotspotChoices: z.array(QtiHotspotChoiceSchema).min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.hotspotChoices, ["hotspotChoices"], "hotspot choice", context);
  });

  const QtiGraphicOrderInteractionSchema = strictObject({
    kind: z.literal("graphicOrderInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    hotspotChoices: z.array(QtiHotspotChoiceSchema).min(1),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.hotspotChoices, ["hotspotChoices"], "hotspot choice", context);
  });

  const QtiGraphicAssociateInteractionSchema = strictObject({
    kind: z.literal("graphicAssociateInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    associableHotspots: z.array(QtiAssociableHotspotSchema).min(2),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.associableHotspots, ["associableHotspots"], "associable hotspot", context);
  });

  const QtiSelectPointInteractionSchema = strictObject({
    kind: z.literal("selectPointInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
  });

  const QtiPositionObjectInteractionSchema = strictObject({
    kind: z.literal("positionObjectInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    object: QtiContentNodeSchema.optional(),
  });

  const QtiSliderInteractionSchema = strictObject({
    kind: z.literal("sliderInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema,
    stepLabel: z.boolean().optional(),
  });

  const QtiMediaInteractionSchema = strictObject({
    kind: z.literal("mediaInteraction"),
    ...QtiInteractionBaseShape,
    responseIdentifier: QtiIdentifierSchema.optional(),
    autostart: z.boolean().optional(),
    loop: z.boolean().optional(),
    object: QtiContentNodeSchema.optional(),
  });

  const QtiCustomInteractionSchema = looseObject({
    kind: z.literal("customInteraction"),
    responseIdentifier: QtiIdentifierSchema.optional(),
    prompt: QtiPromptSchema.optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiDrawingInteractionSchema = looseObject({
    kind: z.literal("drawingInteraction"),
    responseIdentifier: QtiIdentifierSchema.optional(),
    prompt: QtiPromptSchema.optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiEndAttemptInteractionSchema = strictObject({
    kind: z.literal("endAttemptInteraction"),
    title: z.string().optional(),
    children: z.array(QtiContentNodeSchema).optional(),
  });

  const QtiInteractionSchema = z.union([
    QtiChoiceInteractionSchema,
    QtiOrderInteractionSchema,
    QtiAssociateInteractionSchema,
    QtiMatchInteractionSchema,
    QtiInlineChoiceInteractionSchema,
    QtiTextEntryInteractionSchema,
    QtiExtendedTextInteractionSchema,
    QtiUploadInteractionSchema,
    QtiHottextInteractionSchema,
    QtiGapMatchInteractionSchema,
    QtiGraphicGapMatchInteractionSchema,
    QtiHotspotInteractionSchema,
    QtiGraphicOrderInteractionSchema,
    QtiGraphicAssociateInteractionSchema,
    QtiSelectPointInteractionSchema,
    QtiPositionObjectInteractionSchema,
    QtiSliderInteractionSchema,
    QtiMediaInteractionSchema,
    QtiCustomInteractionSchema,
    QtiDrawingInteractionSchema,
    QtiEndAttemptInteractionSchema,
  ]);

  const QtiRubricBlockSchema = strictObject({
    kind: z.literal("rubricBlock"),
    view: z.array(QtiViewSchema).optional(),
    use: z.string().optional(),
    children: z.array(QtiContentNodeSchema).min(1),
  });

  const QtiStimulusBodySchema = strictObject({
    children: z.array(QtiContentNodeSchema).min(1),
  });

  const QtiItemBodySchema = strictObject({
    children: z.array(z.union([QtiRubricBlockSchema, QtiInteractionSchema, QtiContentNodeSchema])).min(1),
  });

  const QtiApipFileHrefSchema = strictObject({
    href: UriReferenceSchema,
  });

  const QtiApipContentLinkInfoSchema = looseObject({
    identifier: QtiIdentifierSchema.optional(),
    qtiLinkIdentifier: QtiIdentifierSchema.optional(),
    qtiHtmlTagIdentifier: QtiIdentifierSchema.optional(),
    fileHrefs: z.array(QtiApipFileHrefSchema).optional(),
    objectLabel: z.string().optional(),
  });

  const QtiApipRelatedElementInfoSchema = looseObject({
    identifierRef: QtiIdentifierSchema.optional(),
    qtiClass: NonEmptyStringSchema.optional(),
    title: z.string().optional(),
  });

  const QtiApipAccessElementSchema = looseObject({
    identifier: QtiIdentifierSchema,
    contentLinkInfos: z.array(QtiApipContentLinkInfoSchema).min(1),
    relatedElementInfo: QtiApipRelatedElementInfoSchema,
  });

  const QtiApipAccessibilityInfoSchema = strictObject({
    accessElements: z.array(QtiApipAccessElementSchema).min(1),
  });

  const QtiApipCompanionMaterialsInfoSchema = looseObject({
    fileHrefs: z.array(QtiApipFileHrefSchema).optional(),
    description: z.string().optional(),
  });

  const QtiApipInclusionOrderSchema = looseObject({
    identifiers: z.array(QtiIdentifierSchema).optional(),
  });

  const QtiApipExternalSupplementalAccessibilitySchema = looseObject({
    fileHrefs: z.array(QtiApipFileHrefSchema).optional(),
    description: z.string().optional(),
  });

  const QtiApipAccessibilitySchema = looseObject({
    companionMaterialsInfo: QtiApipCompanionMaterialsInfoSchema.optional(),
    ...(config.includeExternalSupplementalAccessibility
      ? { externalSupplementalAccessibility: QtiApipExternalSupplementalAccessibilitySchema.optional() }
      : {}),
    inclusionOrder: QtiApipInclusionOrderSchema.optional(),
    accessibilityInfo: QtiApipAccessibilityInfoSchema.optional(),
  });

  const QtiApipAccessibilityDocumentSchema = strictObject({
    apipAccessibility: QtiApipAccessibilitySchema,
  });

  const QtiModalFeedbackSchema = strictObject({
    kind: z.literal("modalFeedback"),
    identifier: QtiIdentifierSchema.optional(),
    outcomeIdentifier: QtiIdentifierSchema.optional(),
    showHide: QtiShowHideSchema.optional(),
    title: z.string().optional(),
    stylesheets: z.array(QtiStylesheetSchema).optional(),
    children: z.array(QtiContentNodeSchema).min(1),
    apipAccessibility: QtiApipAccessibilitySchema.optional(),
  });

  const QtiTestFeedbackSchema = strictObject({
    kind: z.literal("testFeedback"),
    identifier: QtiIdentifierSchema.optional(),
    outcomeIdentifier: QtiIdentifierSchema.optional(),
    access: z.string().optional(),
    showHide: QtiShowHideSchema.optional(),
    title: z.string().optional(),
    children: z.array(QtiContentNodeSchema).min(1),
  });

  const QtiIncludeSchema = strictObject({
    kind: z.literal("include"),
    href: UriReferenceSchema,
    xpointer: z.string().optional(),
  });

  const QtiVariableSchema = strictObject({
    kind: z.literal("variable"),
    identifier: QtiIdentifierSchema,
    weightIdentifier: QtiIdentifierSchema.optional(),
  });

  const QtiBaseValueExpressionSchema = strictObject({
    kind: z.literal("baseValue"),
    baseType: QtiBaseTypeSchema,
    value: z.string(),
  });

  const QtiNullExpressionSchema = strictObject({
    kind: z.literal("null"),
  });

  const QtiCorrectExpressionSchema = strictObject({
    kind: z.literal("correct"),
    identifier: QtiIdentifierSchema.optional(),
  });

  const QtiDefaultExpressionSchema = strictObject({
    kind: z.literal("default"),
    identifier: QtiIdentifierSchema.optional(),
  });

  const QtiFieldValueExpressionSchema = strictObject({
    kind: z.literal("fieldValue"),
    identifier: QtiIdentifierSchema.optional(),
    fieldIdentifier: QtiIdentifierSchema,
  });

  const QtiRandomIntegerExpressionSchema = strictObject({
    kind: z.literal("randomInteger"),
    min: z.number().int(),
    max: z.number().int(),
    step: z.number().int().optional(),
  });

  const QtiRandomFloatExpressionSchema = strictObject({
    kind: z.literal("randomFloat"),
    min: z.number(),
    max: z.number(),
  });

  const QtiTestVariablesExpressionSchema = strictObject({
    kind: z.literal("testVariables"),
    variableIdentifier: QtiIdentifierSchema,
    weightIdentifier: QtiIdentifierSchema.optional(),
    baseType: QtiBaseTypeSchema.optional(),
    includeCategory: z.array(NonEmptyStringSchema).optional(),
    excludeCategory: z.array(NonEmptyStringSchema).optional(),
  });

  const QtiOutcomeAggregateExpressionSchema = z.union([
    strictObject({
      kind: z.literal("outcomeMinimum"),
      outcomeIdentifier: QtiIdentifierSchema,
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
    strictObject({
      kind: z.literal("outcomeMaximum"),
      outcomeIdentifier: QtiIdentifierSchema,
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
  ]);

  const QtiCountExpressionSchema = z.union([
    strictObject({
      kind: z.literal("numberCorrect"),
      sectionIdentifier: QtiIdentifierSchema.optional(),
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
    strictObject({
      kind: z.literal("numberIncorrect"),
      sectionIdentifier: QtiIdentifierSchema.optional(),
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
    strictObject({
      kind: z.literal("numberPresented"),
      sectionIdentifier: QtiIdentifierSchema.optional(),
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
    strictObject({
      kind: z.literal("numberResponded"),
      sectionIdentifier: QtiIdentifierSchema.optional(),
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
    strictObject({
      kind: z.literal("numberSelected"),
      sectionIdentifier: QtiIdentifierSchema.optional(),
      includeCategory: z.array(NonEmptyStringSchema).optional(),
      excludeCategory: z.array(NonEmptyStringSchema).optional(),
    }),
  ]);

  const unaryKinds = [
    "not",
    "random",
    "containerSize",
    "isNull",
    "integerToFloat",
    "round",
    "truncate",
    "mapResponse",
    "mapResponsePoint",
  ] as const;
  const binaryKinds = [
    "gt",
    "lt",
    "gte",
    "lte",
    "durationLT",
    "durationGTE",
    "subtract",
    "divide",
    "match",
    "equal",
    "contains",
    "delete",
    "power",
    "member",
    "integerDivide",
    "integerModulus",
    "inside",
    "patternMatch",
    "stringMatch",
  ] as const;
  const manyKinds = ["and", "or", "sum", "product", "multiple", "ordered", "gcd", "lcm", "max", "min"] as const;

  const QtiExpressionSchema: z.ZodTypeAny = z.lazy(() =>
    z
      .union([
        QtiBaseValueExpressionSchema,
        QtiNullExpressionSchema,
        QtiVariableSchema,
        QtiCorrectExpressionSchema,
        QtiDefaultExpressionSchema,
        QtiFieldValueExpressionSchema,
        QtiRandomIntegerExpressionSchema,
        QtiRandomFloatExpressionSchema,
        QtiTestVariablesExpressionSchema,
        QtiOutcomeAggregateExpressionSchema,
        QtiCountExpressionSchema,
        ...unaryKinds.map((kind) =>
          strictObject({
            kind: z.literal(kind),
            children: z.array(QtiExpressionSchema).length(1),
          }),
        ),
        ...binaryKinds.map((kind) =>
          strictObject({
            kind: z.literal(kind),
            children: z.array(QtiExpressionSchema).length(2),
          }),
        ),
        ...manyKinds.map((kind) =>
          strictObject({
            kind: z.literal(kind),
            children: z.array(QtiExpressionSchema).min(1),
          }),
        ),
        strictObject({
          kind: z.literal("substring"),
          caseSensitive: z.boolean().optional(),
          children: z.array(QtiExpressionSchema).length(2),
        }),
        strictObject({
          kind: z.literal("equalRounded"),
          roundingMode: z.enum(["decimalPlaces", "significantFigures"]).optional(),
          figures: z.number().int(),
          children: z.array(QtiExpressionSchema).length(2),
        }),
        strictObject({
          kind: z.literal("index"),
          n: z.number().int(),
          children: z.array(QtiExpressionSchema).length(1),
        }),
        strictObject({
          kind: z.literal("repeat"),
          numberRepeats: z.number().int(),
          children: z.array(QtiExpressionSchema).length(1),
        }),
        strictObject({
          kind: z.literal("roundTo"),
          roundingMode: z.enum(["decimalPlaces", "significantFigures"]),
          figures: z.number().int(),
          children: z.array(QtiExpressionSchema).length(1),
        }),
        strictObject({
          kind: z.literal("anyN"),
          min: z.number().int().optional(),
          max: z.number().int().optional(),
          children: z.array(QtiExpressionSchema).min(1),
        }),
        strictObject({
          kind: z.literal("statsOperator"),
          name: NonEmptyStringSchema,
          children: z.array(QtiExpressionSchema).min(1),
        }),
        strictObject({
          kind: z.literal("mathOperator"),
          name: NonEmptyStringSchema,
          children: z.array(QtiExpressionSchema).min(1),
        }),
        strictObject({
          kind: z.literal("customOperator"),
          class: NonEmptyStringSchema.optional(),
          definition: UriReferenceSchema.optional(),
          children: z.array(QtiExpressionSchema).optional(),
        }),
      ])
      .superRefine((value, context) => {
        if (value.kind === "randomInteger" && value.min > value.max) {
          addIssue(context, ["min"], "randomInteger min must be less than or equal to max");
        }

        if (value.kind === "randomFloat" && value.min > value.max) {
          addIssue(context, ["min"], "randomFloat min must be less than or equal to max");
        }

        if (value.kind === "anyN") {
          if (value.min !== undefined && value.min < 0) {
            addIssue(context, ["min"], "anyN min must be non-negative");
          }

          if (value.max !== undefined && value.max < 0) {
            addIssue(context, ["max"], "anyN max must be non-negative");
          }

          if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
            addIssue(context, ["min"], "anyN min must be less than or equal to max");
          }
        }

        if (value.kind === "index" && value.n < 1) {
          addIssue(context, ["n"], "index n must be greater than 0");
        }

        if (value.kind === "repeat" && value.numberRepeats < 1) {
          addIssue(context, ["numberRepeats"], "repeat numberRepeats must be greater than 0");
        }

        if (value.kind === "roundTo" && value.figures < 1) {
          addIssue(context, ["figures"], "roundTo figures must be greater than 0");
        }

        if (value.kind === "equalRounded" && value.figures < 1) {
          addIssue(context, ["figures"], "equalRounded figures must be greater than 0");
        }
      }),
  );

  const QtiSetOutcomeValueSchema = strictObject({
    kind: z.literal("setOutcomeValue"),
    identifier: QtiIdentifierSchema,
    expression: QtiExpressionSchema,
  });

  const QtiSetTemplateValueSchema = strictObject({
    kind: z.literal("setTemplateValue"),
    identifier: QtiIdentifierSchema,
    expression: QtiExpressionSchema,
  });

  const QtiSetDefaultValueRuleSchema = strictObject({
    kind: z.literal("setDefaultValue"),
    identifier: QtiIdentifierSchema,
    values: z.array(QtiValueSchema).min(1),
  });

  const QtiSetCorrectResponseRuleSchema = strictObject({
    kind: z.literal("setCorrectResponse"),
    identifier: QtiIdentifierSchema,
    values: z.array(QtiValueSchema).min(1),
  });

  const QtiLookupOutcomeValueRuleSchema = looseObject({
    kind: z.literal("lookupOutcomeValue"),
    identifier: QtiIdentifierSchema.optional(),
    outcomeIdentifier: QtiIdentifierSchema.optional(),
    expression: QtiExpressionSchema.optional(),
  });

  const QtiTemplateConstraintSchema = strictObject({
    kind: z.literal("templateConstraint"),
    expression: QtiExpressionSchema,
  });

  const QtiExitResponseRuleSchema = strictObject({
    kind: z.literal("exitResponse"),
  });

  const QtiExitTemplateRuleSchema = strictObject({
    kind: z.literal("exitTemplate"),
  });

  const QtiExitTestRuleSchema = strictObject({
    kind: z.literal("exitTest"),
  });

  const QtiProcessingFragmentSchema = z.union([
    strictObject({
      kind: z.literal("responseProcessingFragment"),
      href: UriReferenceSchema.optional(),
    }),
    strictObject({
      kind: z.literal("outcomeProcessingFragment"),
      href: UriReferenceSchema.optional(),
    }),
  ]);

  const QtiResponseProcessingRuleSchema: z.ZodTypeAny = z.lazy(() =>
    z.union([
      QtiSetOutcomeValueSchema,
      QtiLookupOutcomeValueRuleSchema,
      QtiExitResponseRuleSchema,
      strictObject({
        kind: z.literal("responseCondition"),
        ifBranch: strictObject({
          expression: QtiExpressionSchema,
          rules: z.array(QtiResponseProcessingRuleSchema).min(1),
        }),
        elseIfBranches: z
          .array(
            strictObject({
              expression: QtiExpressionSchema,
              rules: z.array(QtiResponseProcessingRuleSchema).min(1),
            }),
          )
          .optional(),
        elseRules: z.array(QtiResponseProcessingRuleSchema).optional(),
      }),
      strictObject({
        kind: z.literal("responseElse"),
        rules: z.array(QtiResponseProcessingRuleSchema).min(1),
      }),
      QtiProcessingFragmentSchema,
      QtiIncludeSchema,
    ]),
  );

  const QtiOutcomeProcessingRuleSchema: z.ZodTypeAny = z.lazy(() =>
    z.union([
      QtiSetOutcomeValueSchema,
      QtiLookupOutcomeValueRuleSchema,
      QtiExitTestRuleSchema,
      strictObject({
        kind: z.literal("outcomeCondition"),
        ifBranch: strictObject({
          expression: QtiExpressionSchema,
          rules: z.array(QtiOutcomeProcessingRuleSchema).min(1),
        }),
        elseIfBranches: z
          .array(
            strictObject({
              expression: QtiExpressionSchema,
              rules: z.array(QtiOutcomeProcessingRuleSchema).min(1),
            }),
          )
          .optional(),
        elseRules: z.array(QtiOutcomeProcessingRuleSchema).optional(),
      }),
      strictObject({
        kind: z.literal("outcomeElse"),
        rules: z.array(QtiOutcomeProcessingRuleSchema).min(1),
      }),
      QtiProcessingFragmentSchema,
      QtiIncludeSchema,
    ]),
  );

  const QtiTemplateProcessingRuleSchema: z.ZodTypeAny = z.lazy(() =>
    z.union([
      QtiSetTemplateValueSchema,
      QtiSetDefaultValueRuleSchema,
      QtiSetCorrectResponseRuleSchema,
      QtiTemplateConstraintSchema,
      QtiExitTemplateRuleSchema,
      strictObject({
        kind: z.literal("templateCondition"),
        ifBranch: strictObject({
          expression: QtiExpressionSchema,
          rules: z.array(QtiTemplateProcessingRuleSchema).min(1),
        }),
        elseIfBranches: z
          .array(
            strictObject({
              expression: QtiExpressionSchema,
              rules: z.array(QtiTemplateProcessingRuleSchema).min(1),
            }),
          )
          .optional(),
        elseRules: z.array(QtiTemplateProcessingRuleSchema).optional(),
      }),
      strictObject({
        kind: z.literal("templateElse"),
        rules: z.array(QtiTemplateProcessingRuleSchema).min(1),
      }),
      QtiIncludeSchema,
    ]),
  );

  const QtiResponseProcessingSchema = strictObject({
    rules: z.array(QtiResponseProcessingRuleSchema).default([]),
  });

  const QtiOutcomeProcessingSchema = strictObject({
    rules: z.array(QtiOutcomeProcessingRuleSchema).default([]),
  });

  const QtiTemplateProcessingSchema = strictObject({
    rules: z.array(QtiTemplateProcessingRuleSchema).min(1),
  });

  const QtiPreConditionSchema = strictObject({
    expression: QtiExpressionSchema,
  });

  const QtiBranchRuleSchema = strictObject({
    target: QtiIdentifierSchema.optional(),
    expression: QtiExpressionSchema,
  });

  const QtiSelectionSchema = looseObject({
    select: z.number().int().optional(),
    withReplacement: z.boolean().optional(),
  }).superRefine((value, context) => {
    if (value.select !== undefined && value.select < 1) {
      addIssue(context, ["select"], "selection select must be greater than 0");
    }
  });

  const QtiOrderingSchema = looseObject({
    shuffle: z.boolean().optional(),
  });

  const QtiTimeLimitsSchema = strictObject({
    minTime: z.string().optional(),
    maxTime: z.string().optional(),
    allowLateSubmission: z.boolean().optional(),
  });

  const QtiItemSessionControlSchema = strictObject({
    maxAttempts: z.number().int().optional(),
    showFeedback: z.boolean().optional(),
    allowReview: z.boolean().optional(),
    allowComment: z.boolean().optional(),
    validateResponses: z.boolean().optional(),
    showSolution: z.boolean().optional(),
    allowSkipping: z.boolean().optional(),
  }).superRefine((value, context) => {
    if (value.maxAttempts !== undefined && value.maxAttempts < 1) {
      addIssue(context, ["maxAttempts"], "itemSessionControl maxAttempts must be greater than 0");
    }
  });

  const QtiTemplateDefaultSchema = strictObject({
    identifier: QtiIdentifierSchema,
    values: z.array(QtiValueSchema).min(1),
  });

  const QtiWeightSchema = strictObject({
    identifier: QtiIdentifierSchema,
    value: z.number(),
  });

  const QtiVariableMappingSchema = looseObject({
    identifier: QtiIdentifierSchema.optional(),
    sourceIdentifier: QtiIdentifierSchema.optional(),
    targetIdentifier: QtiIdentifierSchema.optional(),
    values: z.array(QtiValueSchema).optional(),
  });

  const QtiAssessmentSectionRefSchema = strictObject({
    identifier: QtiIdentifierSchema,
    href: UriReferenceSchema,
    required: z.boolean().optional(),
    fixed: z.boolean().optional(),
    visible: z.boolean().optional(),
    category: z.array(NonEmptyStringSchema).optional(),
    keepTogether: z.boolean().optional(),
  });

  const QtiAssessmentItemRefSchema = strictObject({
    identifier: QtiIdentifierSchema,
    href: UriReferenceSchema,
    required: z.boolean().optional(),
    fixed: z.boolean().optional(),
    visible: z.boolean().optional(),
    category: z.array(NonEmptyStringSchema).optional(),
    preConditions: z.array(QtiPreConditionSchema).optional(),
    branchRules: z.array(QtiBranchRuleSchema).optional(),
    itemSessionControl: QtiItemSessionControlSchema.optional(),
    timeLimits: QtiTimeLimitsSchema.optional(),
    variableMappings: z.array(QtiVariableMappingSchema).optional(),
    weights: z.array(QtiWeightSchema).optional(),
    templateDefaults: z.array(QtiTemplateDefaultSchema).optional(),
  });

  const QtiAssessmentStimulusRefSchema = strictObject({
    identifier: QtiIdentifierSchema.optional(),
    href: UriReferenceSchema,
    required: z.boolean().optional(),
    fixed: z.boolean().optional(),
    category: z.array(NonEmptyStringSchema).optional(),
  });

  const QtiAssessmentSectionRawSchema: z.ZodTypeAny = z.lazy(() =>
    strictObject({
      identifier: QtiIdentifierSchema,
      title: z.string().optional(),
      visible: z.boolean().optional(),
      required: z.boolean().optional(),
      fixed: z.boolean().optional(),
      keepTogether: z.boolean().optional(),
      preConditions: z.array(QtiPreConditionSchema).optional(),
      branchRules: z.array(QtiBranchRuleSchema).optional(),
      itemSessionControl: QtiItemSessionControlSchema.optional(),
      timeLimits: QtiTimeLimitsSchema.optional(),
      selection: QtiSelectionSchema.optional(),
      ordering: QtiOrderingSchema.optional(),
      rubricBlocks: z.array(QtiRubricBlockSchema).optional(),
      children: z
        .array(
          z.union([
            QtiIncludeSchema,
            QtiAssessmentItemRefSchema,
            QtiAssessmentSectionRawSchema,
            QtiAssessmentSectionRefSchema,
          ]),
        )
        .default([]),
    }),
  );

  const QtiAssessmentSectionSchema: z.ZodTypeAny = QtiAssessmentSectionRawSchema.superRefine((input, context) => {
    const value = input as { children?: unknown[] };
    const identifierValues = asArray(value.children).flatMap((child) => {
      if (!child || typeof child !== "object" || !("identifier" in child)) {
        return [];
      }

      const identifier = child.identifier;
      return typeof identifier === "string" && identifier.length > 0 ? [identifier] : [];
    });

    for (const duplicate of collectDuplicates(identifierValues)) {
      addIssue(context, ["children"], `Duplicate assessment section child identifier "${duplicate}"`);
    }
  });

  const QtiTestPartSchema = strictObject({
    identifier: QtiIdentifierSchema,
    navigationMode: QtiNavigationModeSchema,
    submissionMode: QtiSubmissionModeSchema,
    preConditions: z.array(QtiPreConditionSchema).optional(),
    branchRules: z.array(QtiBranchRuleSchema).optional(),
    itemSessionControl: QtiItemSessionControlSchema.optional(),
    timeLimits: QtiTimeLimitsSchema.optional(),
    children: z.array(z.union([QtiAssessmentSectionSchema, QtiAssessmentSectionRefSchema])).min(1),
    testFeedbacks: z.array(QtiTestFeedbackSchema).optional(),
  });

  const QtiAssessmentItemRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    title: z.string().optional(),
    label: z.string().optional(),
    adaptive: z.boolean().optional(),
    timeDependent: z.boolean().optional(),
    toolName: z.string().optional(),
    toolVersion: z.string().optional(),
    responseDeclarations: z.array(QtiResponseDeclarationSchema).default([]),
    outcomeDeclarations: z.array(QtiOutcomeDeclarationSchema).default([]),
    templateDeclarations: z.array(QtiTemplateDeclarationSchema).default([]),
    templateProcessing: QtiTemplateProcessingSchema.optional(),
    ...(config.includeAssessmentStimulus
      ? { assessmentStimulusRefs: z.array(QtiAssessmentStimulusRefSchema).optional() }
      : {}),
    stylesheets: z.array(QtiStylesheetSchema).optional(),
    itemBody: QtiItemBodySchema.optional(),
    responseProcessing: QtiResponseProcessingSchema.optional(),
    modalFeedbacks: z.array(QtiModalFeedbackSchema).optional(),
    apipAccessibility: QtiApipAccessibilitySchema.optional(),
  });

  const QtiAssessmentItemSchema = QtiAssessmentItemRawSchema.superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.responseDeclarations, ["responseDeclarations"], "response declaration", context);
    uniqueIdentifiersRefinement(value.outcomeDeclarations, ["outcomeDeclarations"], "outcome declaration", context);
    uniqueIdentifiersRefinement(value.templateDeclarations, ["templateDeclarations"], "template declaration", context);
  });

  const QtiAssessmentStimulusSchema: z.ZodTypeAny = config.includeAssessmentStimulus
    ? strictObject({
        identifier: QtiIdentifierSchema,
        title: z.string().optional(),
        stylesheets: z.array(QtiStylesheetSchema).optional(),
        stimulusBody: QtiStimulusBodySchema,
        apipAccessibility: QtiApipAccessibilitySchema.optional(),
      })
    : z.never();

  const QtiAssessmentTestRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    title: z.string().optional(),
    toolName: z.string().optional(),
    toolVersion: z.string().optional(),
    outcomeDeclarations: z.array(QtiOutcomeDeclarationSchema).default([]),
    timeLimits: QtiTimeLimitsSchema.optional(),
    stylesheets: z.array(QtiStylesheetSchema).optional(),
    testParts: z.array(QtiTestPartSchema).min(1),
    outcomeProcessing: QtiOutcomeProcessingSchema.optional(),
    testFeedbacks: z.array(QtiTestFeedbackSchema).optional(),
  });

  const QtiAssessmentTestSchema = QtiAssessmentTestRawSchema.superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.outcomeDeclarations, ["outcomeDeclarations"], "outcome declaration", context);
    uniqueIdentifiersRefinement(value.testParts, ["testParts"], "test part", context);
  });

  const QtiMetadataSchema = strictObject({
    itemTemplate: z.boolean().optional(),
    timeDependent: z.boolean().optional(),
    composite: z.boolean().optional(),
    interactionType: z.array(NonEmptyStringSchema).optional(),
    feedbackType: QtiFeedbackTypeSchema.optional(),
    solutionAvailable: z.boolean().optional(),
    ...(config.includeScoringModes ? { scoringMode: z.array(QtiScoringModeSchema).optional() } : {}),
    toolName: z.string().max(256).optional(),
    toolVersion: z.string().max(256).optional(),
    toolVendor: z.string().max(256).optional(),
  });

  const QtiMetadataDocumentSchema = strictObject({
    qtiMetadata: QtiMetadataSchema,
  });

  const QtiCurriculumStandardsMetadataSetSchema = strictObject({
    resourceLabel: z.string().optional(),
    resourcePartId: z.string().optional(),
    curriculumStandardsMetadata: z
      .array(
        strictObject({
          providerId: z.string().optional(),
          setOfGuids: z
            .array(
              strictObject({
                region: z.string().optional(),
                version: z.string().optional(),
                labelledGuids: z
                  .array(
                    strictObject({
                      label: z.string().optional(),
                      guid: z.string(),
                    }),
                  )
                  .min(1),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  });

  const QtiCurriculumStandardsMetadataSetDocumentSchema = strictObject({
    curriculumStandardsMetadataSet: QtiCurriculumStandardsMetadataSetSchema,
  });

  const QtiSessionIdentifierSchema = strictObject({
    sourceId: UriReferenceSchema,
    identifier: NonEmptyStringSchema,
  });

  const QtiAssessmentResultContextSchema = strictObject({
    sourcedId: QtiIdentifierSchema.optional(),
    sessionIdentifiers: z.array(QtiSessionIdentifierSchema).optional(),
  });

  const QtiCandidateResponseSchema = strictObject({
    values: z.array(QtiValueSchema).default([]),
  });

  const QtiResultResponseVariableRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    correctResponse: QtiCorrectResponseSchema.optional(),
    candidateResponse: QtiCandidateResponseSchema,
    choiceSequence: z.array(NonEmptyStringSchema).optional(),
  });

  const QtiResultResponseVariableSchema = QtiResultResponseVariableRawSchema.superRefine((value, context) => {
    validateDeclaredValues(
      value.cardinality,
      value.baseType,
      value.candidateResponse.values,
      ["candidateResponse", "values"],
      context,
    );
  });

  const QtiResultTemplateVariableRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    values: z.array(QtiValueSchema).default([]),
  });

  const QtiResultTemplateVariableSchema = QtiResultTemplateVariableRawSchema.superRefine((value, context) => {
    validateDeclaredValues(value.cardinality, value.baseType, value.values, ["values"], context);
  });

  const QtiResultOutcomeVariableRawSchema = strictObject({
    identifier: QtiIdentifierSchema,
    cardinality: QtiCardinalitySchema,
    baseType: QtiBaseTypeSchema.optional(),
    values: z.array(QtiValueSchema).default([]),
    view: QtiViewSchema.optional(),
    interpretation: z.string().optional(),
    longInterpretation: UriReferenceSchema.optional(),
    normalMaximum: z.number().optional(),
    normalMinimum: z.number().optional(),
    masteryValue: z.number().optional(),
  });

  const QtiResultOutcomeVariableSchema = QtiResultOutcomeVariableRawSchema.superRefine((value, context) => {
    validateDeclaredValues(value.cardinality, value.baseType, value.values, ["values"], context);
  });

  const QtiTestResultSchema = strictObject({
    identifier: NonEmptyStringSchema,
    datestamp: z.string(),
    responseVariables: z.array(QtiResultResponseVariableSchema).optional(),
    templateVariables: z.array(QtiResultTemplateVariableSchema).optional(),
    outcomeVariables: z.array(QtiResultOutcomeVariableSchema).optional(),
  });

  const QtiItemResultSchema = strictObject({
    identifier: NonEmptyStringSchema,
    sequenceIndex: z.number().int().optional(),
    datestamp: z.string(),
    sessionStatus: QtiSessionStatusSchema,
    responseVariables: z.array(QtiResultResponseVariableSchema).optional(),
    templateVariables: z.array(QtiResultTemplateVariableSchema).optional(),
    outcomeVariables: z.array(QtiResultOutcomeVariableSchema).optional(),
    candidateComment: z.string().optional(),
  });

  const QtiAssessmentResultSchema = strictObject({
    context: QtiAssessmentResultContextSchema,
    testResult: QtiTestResultSchema.optional(),
    itemResults: z.array(QtiItemResultSchema).optional(),
  });

  const QtiAssessmentResultDocumentSchema = strictObject({
    assessmentResult: QtiAssessmentResultSchema,
  });

  const QtiUsageTargetObjectSchema = strictObject({
    identifier: NonEmptyStringSchema,
    partIdentifier: QtiIdentifierSchema.optional(),
  });

  const QtiUsageMappingSchema = strictObject({
    lowerBound: z.number().optional(),
    upperBound: z.number().optional(),
    defaultValue: z.number().optional(),
    entries: z.array(QtiMapEntrySchema).min(1),
  });

  const QtiOrdinaryStatisticSchema = strictObject({
    kind: z.literal("ordinaryStatistic"),
    name: QtiIdentifierSchema,
    glossary: UriReferenceSchema.optional(),
    context: UriReferenceSchema,
    caseCount: z.number().int().optional(),
    stdError: z.number().optional(),
    stdDeviation: z.number().optional(),
    lastUpdated: z.string().optional(),
    targetObjects: z.array(QtiUsageTargetObjectSchema).min(1),
    value: QtiValueSchema,
  });

  const QtiCategorizedStatisticSchema = strictObject({
    kind: z.literal("categorizedStatistic"),
    name: QtiIdentifierSchema,
    glossary: UriReferenceSchema.optional(),
    context: UriReferenceSchema,
    caseCount: z.number().int().optional(),
    stdError: z.number().optional(),
    stdDeviation: z.number().optional(),
    lastUpdated: z.string().optional(),
    targetObjects: z.array(QtiUsageTargetObjectSchema).min(1),
    mapping: QtiUsageMappingSchema,
  });

  const QtiUsageDataSchema = strictObject({
    glossary: UriReferenceSchema.optional(),
    statistics: z.array(z.union([QtiOrdinaryStatisticSchema, QtiCategorizedStatisticSchema])).default([]),
  });

  const QtiUsageDataDocumentSchema = strictObject({
    usageData: QtiUsageDataSchema,
  });

  const QtiManifestMetadataSchema = strictObject({
    schema: ManifestSchemaValueSchema,
    schemaVersion: z.literal("1.0.0"),
    qtiMetadata: QtiMetadataSchema.optional(),
    curriculumStandardsMetadataSet: config.includeAssessmentStimulus
      ? QtiCurriculumStandardsMetadataSetSchema.optional()
      : z.undefined().optional(),
    lom: z.unknown().optional(),
  });

  const QtiManifestResourceMetadataSchema = strictObject({
    qtiMetadata: QtiMetadataSchema.optional(),
    curriculumStandardsMetadataSet: config.includeAssessmentStimulus
      ? QtiCurriculumStandardsMetadataSetSchema.optional()
      : z.undefined().optional(),
    lom: z.unknown().optional(),
  });

  const QtiManifestFileSchema = strictObject({
    href: UriReferenceSchema,
    metadata: QtiManifestResourceMetadataSchema.optional(),
  });

  const QtiManifestDependencySchema = strictObject({
    identifierRef: NonEmptyStringSchema,
  });

  const QtiManifestResourceSchema = strictObject({
    identifier: NonEmptyStringSchema,
    type: ManifestResourceTypeSchema,
    href: UriReferenceSchema.optional(),
    metadata: QtiManifestResourceMetadataSchema.optional(),
    files: z.array(QtiManifestFileSchema).optional(),
    dependencies: z.array(QtiManifestDependencySchema).optional(),
  });

  const QtiManifestSchema = strictObject({
    identifier: NonEmptyStringSchema,
    metadata: QtiManifestMetadataSchema,
    organizations: strictObject({}),
    resources: z.array(QtiManifestResourceSchema).default([]),
  }).superRefine((value, context) => {
    uniqueIdentifiersRefinement(value.resources, ["resources"], "manifest resource", context);
  });

  const QtiManifestDocumentSchema = strictObject({
    manifest: QtiManifestSchema,
  });

  const QtiAssessmentItemDocumentSchema = strictObject({
    assessmentItem: QtiAssessmentItemSchema,
  });

  const QtiAssessmentSectionDocumentSchema = strictObject({
    assessmentSection: QtiAssessmentSectionSchema,
  });

  const QtiAssessmentStimulusDocumentSchema: z.ZodTypeAny = config.includeAssessmentStimulus
    ? strictObject({
        assessmentStimulus: QtiAssessmentStimulusSchema,
      })
    : z.never();

  const QtiAssessmentTestDocumentSchema = strictObject({
    assessmentTest: QtiAssessmentTestSchema,
  });

  const QtiResponseDeclarationDocumentSchema = strictObject({
    responseDeclaration: QtiResponseDeclarationSchema,
  });

  const QtiOutcomeDeclarationDocumentSchema = strictObject({
    outcomeDeclaration: QtiOutcomeDeclarationSchema,
  });

  const QtiTemplateDeclarationDocumentSchema = strictObject({
    templateDeclaration: QtiTemplateDeclarationSchema,
  });

  const QtiResponseProcessingDocumentSchema = strictObject({
    responseProcessing: QtiResponseProcessingSchema,
  });

  const QtiOutcomeProcessingDocumentSchema = strictObject({
    outcomeProcessing: QtiOutcomeProcessingSchema,
  });

  const QtiTemplateProcessingDocumentSchema = strictObject({
    templateProcessing: QtiTemplateProcessingSchema,
  });

  const QtiItemBodyDocumentSchema = strictObject({
    itemBody: QtiItemBodySchema,
  });

  const QtiModalFeedbackDocumentSchema = strictObject({
    modalFeedback: QtiModalFeedbackSchema,
  });

  return {
    XmlExtensionNodeSchema,
    XmlExtensionNodeListSchema,
    QtiContentNodeSchema,
    QtiStylesheetSchema,
    QtiValueSchema,
    QtiMetadataSchema,
    QtiMetadataDocumentSchema,
    QtiCurriculumStandardsMetadataSetSchema,
    QtiCurriculumStandardsMetadataSetDocumentSchema,
    QtiApipAccessibilitySchema,
    QtiApipAccessibilityDocumentSchema,
    QtiResponseDeclarationRawSchema,
    QtiResponseDeclarationSchema,
    QtiOutcomeDeclarationRawSchema,
    QtiOutcomeDeclarationSchema,
    QtiTemplateDeclarationRawSchema,
    QtiTemplateDeclarationSchema,
    QtiExpressionSchema,
    QtiResponseProcessingSchema,
    QtiOutcomeProcessingSchema,
    QtiTemplateProcessingSchema,
    QtiBranchRuleSchema,
    QtiSelectionSchema,
    QtiOrderingSchema,
    QtiTimeLimitsSchema,
    QtiItemSessionControlSchema,
    QtiAssessmentItemRefSchema,
    QtiAssessmentSectionRefSchema,
    QtiAssessmentSectionRawSchema,
    QtiAssessmentSectionSchema,
    QtiAssessmentStimulusRefSchema,
    QtiTestPartSchema,
    QtiAssessmentItemRawSchema,
    QtiAssessmentItemSchema,
    QtiAssessmentStimulusSchema,
    QtiAssessmentTestRawSchema,
    QtiAssessmentTestSchema,
    QtiItemBodySchema,
    QtiStimulusBodySchema,
    QtiRubricBlockSchema,
    QtiModalFeedbackSchema,
    QtiTestFeedbackSchema,
    QtiChoiceInteractionSchema,
    QtiOrderInteractionSchema,
    QtiAssociateInteractionSchema,
    QtiMatchInteractionSchema,
    QtiInlineChoiceInteractionSchema,
    QtiTextEntryInteractionSchema,
    QtiExtendedTextInteractionSchema,
    QtiUploadInteractionSchema,
    QtiHottextInteractionSchema,
    QtiGapMatchInteractionSchema,
    QtiHotspotInteractionSchema,
    QtiMediaInteractionSchema,
    QtiManifestSchema,
    QtiManifestDocumentSchema,
    QtiAssessmentResultSchema,
    QtiAssessmentResultDocumentSchema,
    QtiUsageDataSchema,
    QtiUsageDataDocumentSchema,
    QtiAssessmentItemDocumentSchema,
    QtiAssessmentSectionDocumentSchema,
    QtiAssessmentStimulusDocumentSchema,
    QtiAssessmentTestDocumentSchema,
    QtiResponseDeclarationDocumentSchema,
    QtiOutcomeDeclarationDocumentSchema,
    QtiTemplateDeclarationDocumentSchema,
    QtiResponseProcessingDocumentSchema,
    QtiOutcomeProcessingDocumentSchema,
    QtiTemplateProcessingDocumentSchema,
    QtiItemBodyDocumentSchema,
    QtiModalFeedbackDocumentSchema,
  } as const;
}
