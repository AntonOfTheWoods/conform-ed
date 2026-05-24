import { z } from "zod";

export const NonEmptyStringSchema = z.string().min(1);
export const UriReferenceSchema = z.string().min(1);
export const YesNoSchema = z.enum(["Yes", "No"]);
export const LowerYesNoSchema = z.enum(["yes", "no"]);
export const XmlSpaceSchema = z.enum(["default", "preserve"]);
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
