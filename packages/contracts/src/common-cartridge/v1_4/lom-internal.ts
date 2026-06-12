import { z } from "zod";

import { LowerYesNoSchema, addIssue, looseObject, strictObject } from "./shared";

const LomAggregationLevelValueSchema = z.enum(["1", "2", "3", "4"]);
const LomContextValueSchema = z.enum(["school", "higher education", "training", "other"]);
const LomDifficultyValueSchema = z.enum(["very easy", "easy", "medium", "difficult", "very difficult"]);
const LomInteractivityLevelValueSchema = z.enum(["very low", "low", "medium", "high", "very high"]);
const LomInteractivityTypeValueSchema = z.enum(["active", "expositive", "mixed"]);
const LomKindValueSchema = z.enum([
  "ispartof",
  "haspart",
  "isversionof",
  "hasversion",
  "isformatof",
  "hasformat",
  "references",
  "isreferencedby",
  "isbasedon",
  "isbasisfor",
  "requires",
  "isrequiredby",
]);
const LomLearningResourceTypeValueSchema = z.enum([
  "exercise",
  "simulation",
  "questionnaire",
  "diagram",
  "figure",
  "graph",
  "index",
  "slide",
  "table",
  "narrative text",
  "exam",
  "experiment",
  "problem statement",
  "self assessment",
  "lecture",
]);
const LomNameValueSchema = z.enum([
  "pc-dos",
  "ms-windows",
  "macos",
  "unix",
  "multi-os",
  "none",
  "any",
  "netscape communicator",
  "ms-internet explorer",
  "opera",
  "amaya",
]);
const LomPurposeValueSchema = z.enum([
  "discipline",
  "idea",
  "prerequisite",
  "educational objective",
  "accessibility restrictions",
  "educational level",
  "skill level",
  "security level",
  "competency",
]);
const LomRoleLifeCycleValueSchema = z.enum([
  "author",
  "publisher",
  "unknown",
  "initiator",
  "terminator",
  "validator",
  "editor",
  "graphical designer",
  "technical implementer",
  "content provider",
  "technical validator",
  "educational validator",
  "script writer",
  "instructional designer",
  "subject matter expert",
]);
const LomRoleMetaMetadataValueSchema = z.enum(["creator", "validator"]);
const LomSemanticDensityValueSchema = z.enum(["very low", "low", "medium", "high", "very high"]);
const LomStatusValueSchema = z.enum(["draft", "final", "revised", "unavailable"]);
const LomStructureValueSchema = z.enum(["atomic", "collection", "networked", "hierarchical", "linear"]);
const LomTypeValueSchema = z.enum(["operating system", "browser"]);

type LomVocabularySchemaConfig = {
  aggregationLevel: z.ZodTypeAny;
  context: z.ZodTypeAny;
  copyrightAndOtherRestrictions: z.ZodTypeAny;
  cost: z.ZodTypeAny;
  difficulty: z.ZodTypeAny;
  intendedEndUserRole: z.ZodTypeAny;
  interactivityLevel: z.ZodTypeAny;
  interactivityType: z.ZodTypeAny;
  kind: z.ZodTypeAny;
  learningResourceType: z.ZodTypeAny;
  name: z.ZodTypeAny;
  purpose: z.ZodTypeAny;
  roleLifeCycle: z.ZodTypeAny;
  roleMetaMetadata: z.ZodTypeAny;
  semanticDensity: z.ZodTypeAny;
  status: z.ZodTypeAny;
  structure: z.ZodTypeAny;
  type: z.ZodTypeAny;
};

function createLomProfileSchemas(config: {
  allowExtensions: boolean;
  values: LomVocabularySchemaConfig;
  requirements?:
    | {
        requireGeneral?: boolean;
        requireGeneralTitle?: boolean;
        requireGeneralKeyword?: boolean;
        requireEducational?: boolean;
        requireEducationalIntendedEndUserRole?: boolean;
        requireEducationalTypicalAgeRange?: boolean;
      }
    | undefined;
}) {
  const object = config.allowExtensions ? looseObject : strictObject;

  const LanguageStringSchema = object({
    value: z.string(),
    language: z.string().optional(),
  });

  const LangStringSchema = object({
    string: z.array(LanguageStringSchema),
  });

  const vocabulary = (valueSchema: z.ZodTypeAny) =>
    object({
      source: z.string().optional(),
      value: valueSchema.optional(),
    });

  const AggregationLevelSchema = vocabulary(config.values.aggregationLevel);
  const ContextSchema = vocabulary(config.values.context);
  const CopyrightAndOtherRestrictionsSchema = vocabulary(config.values.copyrightAndOtherRestrictions);
  const CostSchema = vocabulary(config.values.cost);
  const DifficultySchema = vocabulary(config.values.difficulty);
  const IntendedEndUserRoleSchema = vocabulary(config.values.intendedEndUserRole);
  const InteractivityLevelSchema = vocabulary(config.values.interactivityLevel);
  const InteractivityTypeSchema = vocabulary(config.values.interactivityType);
  const KindSchema = vocabulary(config.values.kind);
  const LearningResourceTypeSchema = vocabulary(config.values.learningResourceType);
  const NameSchema = vocabulary(config.values.name);
  const PurposeSchema = vocabulary(config.values.purpose);
  const RoleLifeCycleSchema = vocabulary(config.values.roleLifeCycle);
  const RoleMetaMetadataSchema = vocabulary(config.values.roleMetaMetadata);
  const SemanticDensitySchema = vocabulary(config.values.semanticDensity);
  const StatusSchema = vocabulary(config.values.status);
  const StructureSchema = vocabulary(config.values.structure);
  const TypeSchema = vocabulary(config.values.type);

  const IdentifierSchema = object({
    catalog: z.string().optional(),
    entry: z.string().optional(),
  });

  const DateTimeSchema = object({
    dateTime: z.string().optional(),
    description: LangStringSchema.optional(),
  });

  const ContributeLifeCycleSchema = object({
    role: RoleLifeCycleSchema.optional(),
    entity: z.array(z.string()).optional(),
    date: DateTimeSchema.optional(),
  });

  const ContributeMetaMetadataSchema = object({
    role: RoleMetaMetadataSchema.optional(),
    entity: z.array(z.string()).optional(),
    date: DateTimeSchema.optional(),
  });

  const DurationSchema = object({
    duration: z.string().optional(),
    description: LangStringSchema.optional(),
  });

  const ResourceSchema = object({
    identifier: z.array(IdentifierSchema).optional(),
    description: z.array(LangStringSchema).optional(),
  });

  const RelationSchema = object({
    kind: KindSchema.optional(),
    resource: ResourceSchema.optional(),
  });

  const OrCompositeSchema = object({
    type: TypeSchema.optional(),
    name: NameSchema.optional(),
    minimumVersion: z.string().optional(),
    maximumVersion: z.string().optional(),
  });

  const RequirementSchema = object({
    orComposite: z.array(OrCompositeSchema).optional(),
  });

  const TechnicalSchema = object({
    format: z.array(z.string()).optional(),
    size: z.string().optional(),
    location: z.array(z.string()).optional(),
    requirement: z.array(RequirementSchema).optional(),
    installationRemarks: LangStringSchema.optional(),
    otherPlatformRequirements: LangStringSchema.optional(),
    duration: DurationSchema.optional(),
  });

  const AnnotationSchema = object({
    entity: z.string().optional(),
    date: DateTimeSchema.optional(),
    description: LangStringSchema.optional(),
  });

  const TaxonSchema = object({
    id: z.string().optional(),
    entry: LangStringSchema.optional(),
  });

  const TaxonPathSchema = object({
    source: LangStringSchema.optional(),
    taxon: z.array(TaxonSchema).optional(),
  });

  const ClassificationSchema = object({
    purpose: PurposeSchema.optional(),
    taxonPath: z.array(TaxonPathSchema).optional(),
    description: LangStringSchema.optional(),
    keyword: z.array(LangStringSchema).optional(),
  });

  const EducationalSchema = object({
    interactivityType: InteractivityTypeSchema.optional(),
    learningResourceType: z.array(LearningResourceTypeSchema).optional(),
    interactivityLevel: InteractivityLevelSchema.optional(),
    semanticDensity: SemanticDensitySchema.optional(),
    intendedEndUserRole: z.array(IntendedEndUserRoleSchema).optional(),
    context: z.array(ContextSchema).optional(),
    typicalAgeRange: z.array(LangStringSchema).optional(),
    difficulty: DifficultySchema.optional(),
    typicalLearningTime: DurationSchema.optional(),
    description: LangStringSchema.optional(),
    language: z.array(z.string()).optional(),
  });

  const GeneralSchema = object({
    identifier: z.array(IdentifierSchema).optional(),
    title: LangStringSchema.optional(),
    language: z.array(z.string()).optional(),
    description: z.array(LangStringSchema).optional(),
    keyword: z.array(LangStringSchema).optional(),
    coverage: z.array(LangStringSchema).optional(),
    structure: StructureSchema.optional(),
    aggregationLevel: AggregationLevelSchema.optional(),
  });

  const LifeCycleSchema = object({
    version: LangStringSchema.optional(),
    status: StatusSchema.optional(),
    contribute: z.array(ContributeLifeCycleSchema).optional(),
  });

  const MetaMetadataSchema = object({
    identifier: z.array(IdentifierSchema).optional(),
    contribute: z.array(ContributeMetaMetadataSchema).optional(),
    metadataschema: z.array(z.string()).optional(),
    language: z.string().optional(),
  });

  const RightsSchema = object({
    cost: CostSchema.optional(),
    copyrightAndOtherRestrictions: CopyrightAndOtherRestrictionsSchema.optional(),
    description: LangStringSchema.optional(),
  });

  const LomSchema = object({
    general: GeneralSchema.optional(),
    lifeCycle: LifeCycleSchema.optional(),
    metaMetadata: MetaMetadataSchema.optional(),
    technical: TechnicalSchema.optional(),
    educational: z.array(EducationalSchema).optional(),
    rights: RightsSchema.optional(),
    relation: z.array(RelationSchema).optional(),
    annotation: z.array(AnnotationSchema).optional(),
    classification: z.array(ClassificationSchema).optional(),
  }).superRefine((lom, context) => {
    const singletonChecks: Array<{ key: keyof typeof lom; label: string }> = [
      { key: "general", label: "general" },
      { key: "lifeCycle", label: "lifeCycle" },
      { key: "metaMetadata", label: "metaMetadata" },
      { key: "technical", label: "technical" },
      { key: "rights", label: "rights" },
    ];

    for (const check of singletonChecks) {
      const value = lom[check.key];
      if (Array.isArray(value) && value.length > 1) {
        addIssue(
          context,
          [check.key],
          `LOM Schematron treats ${check.label} as 0..1 even though the XSD uses unordered repeated choices.`,
        );
      }
    }

    const requirements = config.requirements;
    if (!requirements) {
      return;
    }

    const educational = lom.educational ?? [];

    if (requirements.requireGeneral && !lom.general) {
      addIssue(context, ["general"], "This LOM profile requires a general block.");
    }

    if (lom.general) {
      if (requirements.requireGeneralTitle && !lom.general.title) {
        addIssue(context, ["general", "title"], "This LOM profile requires general.title.");
      }

      if (requirements.requireGeneralKeyword && (!lom.general.keyword || lom.general.keyword.length === 0)) {
        addIssue(context, ["general", "keyword"], "This LOM profile requires at least one general.keyword entry.");
      }
    }

    if (requirements.requireEducational && educational.length === 0) {
      addIssue(context, ["educational"], "This LOM profile requires at least one educational block.");
    }

    educational.forEach((block, index) => {
      if (
        requirements.requireEducationalIntendedEndUserRole &&
        (!block.intendedEndUserRole || block.intendedEndUserRole.length === 0)
      ) {
        addIssue(
          context,
          ["educational", index, "intendedEndUserRole"],
          "This LOM profile requires at least one educational.intendedEndUserRole entry.",
        );
      }

      if (
        requirements.requireEducationalTypicalAgeRange &&
        (!block.typicalAgeRange || block.typicalAgeRange.length === 0)
      ) {
        addIssue(
          context,
          ["educational", index, "typicalAgeRange"],
          "This LOM profile requires at least one educational.typicalAgeRange entry.",
        );
      }
    });
  });

  return {
    LanguageStringSchema,
    LangStringSchema,
    AggregationLevelSchema,
    ContextSchema,
    CopyrightAndOtherRestrictionsSchema,
    CostSchema,
    DifficultySchema,
    IntendedEndUserRoleSchema,
    InteractivityLevelSchema,
    InteractivityTypeSchema,
    KindSchema,
    LearningResourceTypeSchema,
    NameSchema,
    PurposeSchema,
    RoleLifeCycleSchema,
    RoleMetaMetadataSchema,
    SemanticDensitySchema,
    StatusSchema,
    StructureSchema,
    TypeSchema,
    IdentifierSchema,
    DateTimeSchema,
    ContributeLifeCycleSchema,
    ContributeMetaMetadataSchema,
    DurationSchema,
    ResourceSchema,
    RelationSchema,
    OrCompositeSchema,
    RequirementSchema,
    TechnicalSchema,
    AnnotationSchema,
    TaxonSchema,
    TaxonPathSchema,
    ClassificationSchema,
    EducationalSchema,
    GeneralSchema,
    LifeCycleSchema,
    MetaMetadataSchema,
    RightsSchema,
    LomSchema,
  };
}

const looseLomValueSchema = z.string();

function createLooseLomProfileSchemas(requirements?: Parameters<typeof createLomProfileSchemas>[0]["requirements"]) {
  return createLomProfileSchemas({
    allowExtensions: true,
    values: {
      aggregationLevel: looseLomValueSchema,
      context: looseLomValueSchema,
      copyrightAndOtherRestrictions: looseLomValueSchema,
      cost: looseLomValueSchema,
      difficulty: looseLomValueSchema,
      intendedEndUserRole: looseLomValueSchema,
      interactivityLevel: looseLomValueSchema,
      interactivityType: looseLomValueSchema,
      kind: looseLomValueSchema,
      learningResourceType: looseLomValueSchema,
      name: looseLomValueSchema,
      purpose: looseLomValueSchema,
      roleLifeCycle: looseLomValueSchema,
      roleMetaMetadata: looseLomValueSchema,
      semanticDensity: looseLomValueSchema,
      status: looseLomValueSchema,
      structure: looseLomValueSchema,
      type: looseLomValueSchema,
    },
    requirements,
  });
}

export const LomManifestProfileSchemas = createLooseLomProfileSchemas();
export const LomResourceProfileSchemas = LomManifestProfileSchemas;
export const LomThinManifestProfileSchemas = LomManifestProfileSchemas;
export const LomThinResourceProfileSchemas = LomResourceProfileSchemas;
export const LomK12ManifestProfileSchemas = createLooseLomProfileSchemas({
  requireGeneral: true,
  requireGeneralKeyword: true,
});
export const LomK12ResourceProfileSchemas = createLooseLomProfileSchemas({
  requireGeneral: true,
  requireGeneralTitle: true,
  requireGeneralKeyword: true,
  requireEducational: true,
  requireEducationalIntendedEndUserRole: true,
  requireEducationalTypicalAgeRange: true,
});
export const LomK12ThinManifestProfileSchemas = LomThinManifestProfileSchemas;
export const LomK12ThinResourceProfileSchemas = LomThinResourceProfileSchemas;

export const LomCcLtiLinkProfileSchemas = createLomProfileSchemas({
  allowExtensions: false,
  values: {
    aggregationLevel: LomAggregationLevelValueSchema,
    context: LomContextValueSchema,
    copyrightAndOtherRestrictions: LowerYesNoSchema,
    cost: LowerYesNoSchema,
    difficulty: LomDifficultyValueSchema,
    intendedEndUserRole: z.enum(["teacher", "author", "learner", "manager"]),
    interactivityLevel: LomInteractivityLevelValueSchema,
    interactivityType: LomInteractivityTypeValueSchema,
    kind: LomKindValueSchema,
    learningResourceType: LomLearningResourceTypeValueSchema,
    name: LomNameValueSchema,
    purpose: LomPurposeValueSchema,
    roleLifeCycle: LomRoleLifeCycleValueSchema,
    roleMetaMetadata: LomRoleMetaMetadataValueSchema,
    semanticDensity: LomSemanticDensityValueSchema,
    status: LomStatusValueSchema,
    structure: LomStructureValueSchema,
    type: LomTypeValueSchema,
  },
});
