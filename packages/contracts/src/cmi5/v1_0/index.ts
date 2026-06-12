import { z } from "zod";

function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

const UriSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/u);

export const Cmi5LanguageStringSchema = strictObject({
  lang: z.string().min(1).optional(),
  value: z.string(),
});

export const Cmi5TextSchema = strictObject({
  langstrings: z.array(Cmi5LanguageStringSchema).min(1),
});

export const Cmi5ObjectiveSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema,
});

export const Cmi5ObjectiveReferenceSchema = strictObject({
  idref: UriSchema,
});

export const Cmi5KeywordReferenceSchema = strictObject({
  idref: UriSchema,
});

export const Cmi5KeywordDefinitionSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema.optional(),
});

export const Cmi5KeywordExtensionSchema = strictObject({
  keywords: z.array(Cmi5KeywordDefinitionSchema).min(1),
});

let Cmi5BlockSchema: z.ZodTypeAny;

export const Cmi5MoveOnSchema = z.enum([
  "NotApplicable",
  "Passed",
  "Completed",
  "CompletedAndPassed",
  "CompletedOrPassed",
]);

export const Cmi5LaunchMethodSchema = z.enum(["AnyWindow", "OwnWindow"]);

export const Cmi5AuSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema,
  objectives: z.array(Cmi5ObjectiveReferenceSchema).min(1).optional(),
  url: UriSchema,
  launchParameters: z.string().optional(),
  entitlementKey: z.string().optional(),
  moveOn: Cmi5MoveOnSchema.optional(),
  masteryScore: z.number().min(0).max(1).optional(),
  launchMethod: Cmi5LaunchMethodSchema.optional(),
  activityType: UriSchema.optional(),
  keywords: z.array(Cmi5KeywordReferenceSchema).min(1).optional(),
});

export const Cmi5CourseStructureItemSchema = z.lazy(() => z.union([Cmi5AuSchema, Cmi5BlockSchema]));

Cmi5BlockSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema,
  objectives: z.array(Cmi5ObjectiveReferenceSchema).min(1).optional(),
  children: z.array(Cmi5CourseStructureItemSchema).min(1),
});

export const Cmi5CourseSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema,
});

export const Cmi5CourseStructureSchema = strictObject({
  course: Cmi5CourseSchema,
  objectives: z.array(Cmi5ObjectiveSchema).min(1).optional(),
  children: z.array(Cmi5CourseStructureItemSchema).min(1),
});

export const Cmi5CourseStructureDocumentSchema = strictObject({
  courseStructure: Cmi5CourseStructureSchema,
  keywords: Cmi5KeywordExtensionSchema.optional(),
});

export const Cmi5V1_0 = {
  Schemas: {
    LanguageString: Cmi5LanguageStringSchema,
    Text: Cmi5TextSchema,
    Objective: Cmi5ObjectiveSchema,
    ObjectiveReference: Cmi5ObjectiveReferenceSchema,
    KeywordReference: Cmi5KeywordReferenceSchema,
    KeywordDefinition: Cmi5KeywordDefinitionSchema,
    KeywordExtension: Cmi5KeywordExtensionSchema,
    Course: Cmi5CourseSchema,
    Au: Cmi5AuSchema,
    Block: Cmi5BlockSchema,
    CourseStructure: Cmi5CourseStructureSchema,
    CourseStructureDocument: Cmi5CourseStructureDocumentSchema,
    MoveOn: Cmi5MoveOnSchema,
    LaunchMethod: Cmi5LaunchMethodSchema,
  },
} as const;

export const Schemas = Cmi5V1_0.Schemas;

export type Cmi5V1_0Schemas = typeof Cmi5V1_0.Schemas;

export const Cmi5V1_0DerivedZodTemplates = {
  description: "cmi5 Quartz Zod schemas for course-structure XML and keyword extension documents",
  specLinks: {
    main: "https://github.com/AICC/CMI-5_Spec_Current/tree/quartz",
    courseStructure: "https://github.com/AICC/CMI-5_Spec_Current/blob/quartz/v1/CourseStructure.xsd",
    keywordExtension: "https://github.com/AICC/CMI-5_Spec_Current/blob/quartz/v1/examples/extended-cmi5.xsd",
  },
  scope: "Course structure XML plus keyword extension documents",
  notes: [
    "This bundle models the official cmi5 course-structure XSD and keyword extension XSD, not the runtime xAPI launch flow.",
    "The XML examples in the Quartz repository map cleanly to a normalized object model with course, objectives, blocks, AUs, and keyword dictionaries.",
  ],
} as const;

export const DerivedZodTemplates = Cmi5V1_0DerivedZodTemplates;
// Inferred types from exported Zod validators.
export type Cmi5LanguageString = z.infer<typeof Cmi5LanguageStringSchema>;
export type Cmi5Text = z.infer<typeof Cmi5TextSchema>;
export type Cmi5Objective = z.infer<typeof Cmi5ObjectiveSchema>;
export type Cmi5ObjectiveReference = z.infer<typeof Cmi5ObjectiveReferenceSchema>;
export type Cmi5KeywordReference = z.infer<typeof Cmi5KeywordReferenceSchema>;
export type Cmi5KeywordDefinition = z.infer<typeof Cmi5KeywordDefinitionSchema>;
export type Cmi5KeywordExtension = z.infer<typeof Cmi5KeywordExtensionSchema>;
export type Cmi5MoveOn = z.infer<typeof Cmi5MoveOnSchema>;
export type Cmi5LaunchMethod = z.infer<typeof Cmi5LaunchMethodSchema>;
export type Cmi5Au = z.infer<typeof Cmi5AuSchema>;
export type Cmi5CourseStructureItem = z.infer<typeof Cmi5CourseStructureItemSchema>;
export type Cmi5Course = z.infer<typeof Cmi5CourseSchema>;
export type Cmi5CourseStructure = z.infer<typeof Cmi5CourseStructureSchema>;
export type Cmi5CourseStructureDocument = z.infer<typeof Cmi5CourseStructureDocumentSchema>;
