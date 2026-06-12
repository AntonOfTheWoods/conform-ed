import { z } from "zod";

export const CALIPER_CONTEXT_V1P1 = "http://purl.imsglobal.org/ctx/caliper/v1p1" as const;
export const CALIPER_CONTEXT_V1P2 = "http://purl.imsglobal.org/ctx/caliper/v1p2" as const;

export const CaliperContextStringSchema = z.union([z.literal(CALIPER_CONTEXT_V1P1), z.literal(CALIPER_CONTEXT_V1P2)]);

export const CaliperTopLevelContextSchema = z.union([
  CaliperContextStringSchema,
  z.array(z.union([z.string(), z.record(z.string(), z.unknown())])).min(1),
]);

export const CaliperNestedContextSchema = z.union([
  CaliperContextStringSchema,
  z.array(z.union([z.string(), z.record(z.string(), z.unknown())])).min(1),
  z.record(z.string(), z.unknown()),
]);

export const CaliperExtensionsSchema = z.record(z.string(), z.unknown());
export const CaliperDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u, "Expected ISO8601 UTC datetime with millisecond precision");
export const CaliperIriSchema = z
  .string()
  .regex(/^(?:[A-Za-z][A-Za-z0-9+.-]*:.+|_:[A-Za-z0-9._-]+)$/u, "Expected absolute IRI/URI or blank-node identifier");
export const CaliperEventIdSchema = z
  .string()
  .regex(/^urn:uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/u);

export const CaliperReferenceObjectSchema = z
  .object({
    id: CaliperIriSchema,
    type: z.string().min(1),
    "@context": CaliperNestedContextSchema.optional(),
    extensions: CaliperExtensionsSchema.optional(),
  })
  .loose();

export const CaliperReferenceSchema = z.union([CaliperIriSchema, CaliperReferenceObjectSchema]);

const CaliperEntityObjectBaseSchema = z
  .object({
    id: CaliperIriSchema,
    type: z.string().min(1),
    "@context": CaliperTopLevelContextSchema.optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    dateCreated: CaliperDateTimeSchema.optional(),
    dateModified: CaliperDateTimeSchema.optional(),
    extensions: CaliperExtensionsSchema.optional(),
  })
  .loose();

const CaliperEventObjectBaseSchema = z
  .object({
    type: z.string().min(1),
    "@context": CaliperTopLevelContextSchema,
    id: CaliperEventIdSchema,
    actor: CaliperReferenceSchema,
    action: z.string().min(1),
    object: CaliperReferenceSchema,
    eventTime: CaliperDateTimeSchema,
    edApp: CaliperReferenceSchema.optional(),
    federatedSession: CaliperReferenceSchema.optional(),
    generated: CaliperReferenceSchema.optional(),
    group: CaliperReferenceSchema.optional(),
    membership: CaliperReferenceSchema.optional(),
    session: CaliperReferenceSchema.optional(),
    target: CaliperReferenceSchema.optional(),
    referrer: CaliperReferenceSchema.optional(),
    extensions: CaliperExtensionsSchema.optional(),
    profile: z.string().min(1).optional(),
  })
  .strict();

export const createCaliperEntitySchema = <TType extends string>(type: TType, requireContext = true) => {
  if (requireContext) {
    return CaliperEntityObjectBaseSchema.extend({
      type: z.literal(type),
      "@context": CaliperTopLevelContextSchema,
    });
  }

  return CaliperEntityObjectBaseSchema.extend({
    type: z.literal(type),
    "@context": CaliperTopLevelContextSchema.optional(),
  });
};

export const createCaliperEventSchema = <TType extends string>(
  type: TType,
  actionSchema: z.ZodType<string> = z.string().min(1),
) =>
  CaliperEventObjectBaseSchema.extend({
    type: z.literal(type),
    action: actionSchema,
  });

export const getReferenceType = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if (!("type" in value)) {
    return null;
  }

  const candidate = (value as { type?: unknown }).type;
  return typeof candidate === "string" ? candidate : null;
};
// Inferred types from exported Zod validators.
export type CaliperContextString = z.infer<typeof CaliperContextStringSchema>;
export type CaliperTopLevelContext = z.infer<typeof CaliperTopLevelContextSchema>;
export type CaliperNestedContext = z.infer<typeof CaliperNestedContextSchema>;
export type CaliperExtensions = z.infer<typeof CaliperExtensionsSchema>;
export type CaliperDateTime = z.infer<typeof CaliperDateTimeSchema>;
export type CaliperIri = z.infer<typeof CaliperIriSchema>;
export type CaliperEventId = z.infer<typeof CaliperEventIdSchema>;
export type CaliperReferenceObject = z.infer<typeof CaliperReferenceObjectSchema>;
export type CaliperReference = z.infer<typeof CaliperReferenceSchema>;
export type createCaliperEntity = z.infer<typeof createCaliperEntitySchema>;
export type createCaliperEvent = z.infer<typeof createCaliperEventSchema>;
