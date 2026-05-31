import { z } from "zod";

const LocaleTagSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/u);
const TextValueSchema = z.union([z.string(), z.record(LocaleTagSchema, z.string())]);

function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export const ImsxCodeMajorSchema = z.enum(["failure", "processing", "success", "unsupported"]);
export const ImsxSeveritySchema = z.enum(["error", "status", "warning"]);
export const ImsxCodeMinorFieldValueSchema = z.enum([
  "forbidden",
  "fullsuccess",
  "internal_server_error",
  "invalid_data",
  "invalid_query_parameter",
  "misdirected_request",
  "not_acceptable",
  "not_allowed",
  "not_found",
  "not_modified",
  "server_busy",
  "unauthorizedrequest",
  "unknown",
]);

export const ImsxCodeMinorFieldSchema = strictObject({
  imsx_codeMinorFieldName: TextValueSchema,
  imsx_codeMinorFieldValue: ImsxCodeMinorFieldValueSchema,
});

export const ImsxCodeMinorSchema = strictObject({
  imsx_codeMinorField: z.union([ImsxCodeMinorFieldSchema, z.array(ImsxCodeMinorFieldSchema).min(1)]),
});

export const ImsxStatusInfoSchema = strictObject({
  imsx_codeMajor: ImsxCodeMajorSchema,
  imsx_severity: ImsxSeveritySchema,
  imsx_description: TextValueSchema.optional(),
  imsx_codeMinor: ImsxCodeMinorSchema.optional(),
});
// Inferred types from exported Zod validators.
export type ImsxCodeMajor = z.infer<typeof ImsxCodeMajorSchema>;
export type ImsxSeverity = z.infer<typeof ImsxSeveritySchema>;
export type ImsxCodeMinorFieldValue = z.infer<typeof ImsxCodeMinorFieldValueSchema>;
export type ImsxCodeMinorField = z.infer<typeof ImsxCodeMinorFieldSchema>;
export type ImsxCodeMinor = z.infer<typeof ImsxCodeMinorSchema>;
export type ImsxStatusInfo = z.infer<typeof ImsxStatusInfoSchema>;
