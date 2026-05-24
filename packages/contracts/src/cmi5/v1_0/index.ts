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

export const Cmi5AuSchema = strictObject({
  id: UriSchema,
  title: Cmi5TextSchema,
  description: Cmi5TextSchema,
  objectives: z.array(Cmi5ObjectiveReferenceSchema).min(1).optional(),
  url: UriSchema,
  launchParameters: z.string().optional(),
  entitlementKey: z.string().optional(),
  moveOn: z.enum(["NotApplicable", "Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed"]).optional(),
  masteryScore: z.number().min(0).max(1).optional(),
  launchMethod: z.enum(["AnyWindow", "OwnWindow"]).optional(),
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

export namespace Cmi5V1_0 {
  export namespace Schemas {
    export const LanguageString = Cmi5LanguageStringSchema;
    export const Text = Cmi5TextSchema;
    export const Objective = Cmi5ObjectiveSchema;
    export const ObjectiveReference = Cmi5ObjectiveReferenceSchema;
    export const KeywordReference = Cmi5KeywordReferenceSchema;
    export const KeywordDefinition = Cmi5KeywordDefinitionSchema;
    export const KeywordExtension = Cmi5KeywordExtensionSchema;
    export const Course = Cmi5CourseSchema;
    export const Au = Cmi5AuSchema;
    export const Block = Cmi5BlockSchema;
    export const CourseStructure = Cmi5CourseStructureSchema;
    export const CourseStructureDocument = Cmi5CourseStructureDocumentSchema;
  }
}

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
