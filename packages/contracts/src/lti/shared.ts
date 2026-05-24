import { z } from "zod";

export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

const UriSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/u);

export const NonEmptyStringSchema = z.string().min(1);
export const UrlSchema = z.url();
export const UriReferenceSchema = UriSchema;
export const LtiVersionSchema = z.literal("1.3.0");
export const DocumentTargetSchema = z.enum(["embed", "frame", "iframe", "popup", "tab", "window"]);
export const RoleUriSchema = UriSchema;

export const ResourceLinkSchema = strictObject({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema.optional(),
  description: z.string().optional(),
});

export const ContextSchema = strictObject({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema.optional(),
  title: NonEmptyStringSchema.optional(),
  type: z.array(NonEmptyStringSchema).min(1).optional(),
});

export const LaunchPresentationSchema = strictObject({
  documentTarget: DocumentTargetSchema.optional(),
  locale: NonEmptyStringSchema.optional(),
  height: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  returnUrl: UrlSchema.optional(),
});

export const LisSchema = strictObject({
  personSourcedId: NonEmptyStringSchema.optional(),
  courseOfferingSourcedId: NonEmptyStringSchema.optional(),
  courseSectionSourcedId: NonEmptyStringSchema.optional(),
  membershipSourcedId: NonEmptyStringSchema.optional(),
});

export const RolesSchema = z.array(RoleUriSchema).min(1);
export const CustomParametersSchema = z.record(z.string().min(1), z.union([z.string(), z.number(), z.boolean()]));

export const ImageResourceSchema = strictObject({
  url: UrlSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().optional(),
});
