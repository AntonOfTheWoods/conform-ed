import { z } from "zod";

function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export function extensibleEnum<Values extends readonly [string, ...string[]]>(values: Values) {
  return z.union([z.enum(values), ExtensibleVocabularyValueSchema]);
}

export function guidReferenceSchema<const EntityType extends string>(entityType: EntityType) {
  return strictObject({
    href: UrlSchema,
    sourcedId: SourcedIdSchema,
    type: z.literal(entityType),
  });
}

export const UrlSchema = z.url();
export const DateSchema = z.iso.date();
export const DateTimeSchema = z.iso.datetime();
export const SourcedIdSchema = z.string();
export const EntityStatusSchema = z.enum(["active", "tobedeleted"]);
export const TrueFalseStringSchema = z.enum(["true", "false"]);
export const ExtensibleVocabularyValueSchema = z.string().regex(/^(ext:)[a-zA-Z0-9.\-_]+$/u);

export const MetadataSchema = z.record(z.string(), z.unknown());

export const AcadSessionGuidRefSchema = guidReferenceSchema("academicSession");
export const ClassGuidRefSchema = guidReferenceSchema("class");
export const CourseGuidRefSchema = guidReferenceSchema("course");
export const OrgGuidRefSchema = guidReferenceSchema("org");
export const ResourceGuidRefSchema = guidReferenceSchema("resource");
export const UserGuidRefSchema = guidReferenceSchema("user");

export const ImsxCodeMajorSchema = z.enum(["success", "processing", "failure", "unsupported"]);
export const ImsxSeveritySchema = z.enum(["status", "warning", "error"]);
export const ImsxCodeMinorFieldValueSchema = z.enum([
  "deletefailure",
  "forbidden",
  "fullsuccess",
  "internal_server_error",
  "invalid_filter_field",
  "invalid_selection_field",
  "invalid_sort_field",
  "invaliddata",
  "server_busy",
  "unauthorisedrequest",
  "unknownobject",
  "unsupported",
]);

export const ImsxCodeMinorFieldSchema = strictObject({
  imsx_codeMinorFieldName: z.string(),
  imsx_codeMinorFieldValue: ImsxCodeMinorFieldValueSchema,
});

export const ImsxCodeMinorSchema = strictObject({
  imsx_codeMinorField: z.array(ImsxCodeMinorFieldSchema).min(1),
});

export const ImsxStatusInfoSchema = strictObject({
  imsx_codeMajor: ImsxCodeMajorSchema,
  imsx_severity: ImsxSeveritySchema,
  imsx_description: z.string().optional(),
  imsx_CodeMinor: ImsxCodeMinorSchema.optional(),
});

export { strictObject };
