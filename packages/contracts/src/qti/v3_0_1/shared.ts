import { z } from "zod";

export const NonEmptyStringSchema = z.string().min(1);
export const UriReferenceSchema = NonEmptyStringSchema;
export const QtiIdentifierSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9._-]*$/u);
export const QtiIdentifierListSchema = z.array(QtiIdentifierSchema);
export const QtiStringListSchema = z.array(NonEmptyStringSchema);
export const QtiCoordsSchema = NonEmptyStringSchema;
export const QtiMimeTypeSchema = NonEmptyStringSchema;
export const QtiStringOrNumberSchema = z.union([z.string(), z.number()]);
export const QtiIntegerOrVariableSchema = z.union([z.number().int(), NonEmptyStringSchema]);
export const QtiNumberOrVariableSchema = z.union([z.number(), NonEmptyStringSchema]);

export const QtiCardinalitySchema = z.enum(["single", "multiple", "ordered", "record"]);

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

export const QtiShowHideSchema = z.enum(["show", "hide"]);
export const QtiViewSchema = z.enum(["author", "candidate", "proctor", "scorer", "testConstructor", "tutor"]);
export const QtiDirectionSchema = z.enum(["ltr", "rtl", "auto"]);
export const QtiOrientationSchema = z.enum(["horizontal", "vertical"]);
export const QtiNavigationModeSchema = z.enum(["linear", "nonlinear"]);
export const QtiSubmissionModeSchema = z.enum(["individual", "simultaneous"]);
export const QtiSuppressTtsSchema = z.enum(["computer-read-aloud", "screen-reader", "all"]);
export const QtiShapeSchema = z.enum(["circle", "default", "ellipse", "poly", "rect"]);
export const QtiExternalScoredSchema = z.enum(["externalMachine", "human"]);
export const QtiSessionStatusSchema = z.enum([
  "final",
  "initial",
  "pendingExternalScoring",
  "pendingResponseProcessing",
  "pendingSubmission",
]);
export const QtiScoreStatusSchema = z.enum(["notscored", "scored"]);
export const QtiAnsweredStatusSchema = z.enum(["notpresented", "presented", "attempted", "answered"]);
export const QtiSupportAssignmentSchema = z.enum(["assigned", "universal", "prohibited", "inherit"]);

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

export function createXmlNodeSchema(childSchema: z.ZodTypeAny): z.ZodTypeAny {
  return z.lazy(() =>
    strictObject({
      kind: z.literal("xml"),
      namespace: z.string().optional(),
      name: NonEmptyStringSchema,
      value: z.string().optional(),
      attributes: XmlForeignAttributesSchema.optional(),
      children: z.array(childSchema).optional(),
    }),
  );
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
