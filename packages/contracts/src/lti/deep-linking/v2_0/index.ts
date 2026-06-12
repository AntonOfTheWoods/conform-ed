export * from "../../shared";

import { z } from "zod";

import {
  ContextSchema,
  CustomParametersSchema,
  ImageResourceSchema,
  LaunchPresentationSchema,
  LisSchema,
  NonEmptyStringSchema,
  ResourceLinkSchema,
  RolesSchema,
  UrlSchema,
  LtiVersionSchema,
  strictObject,
} from "../../shared";
import { LineItemSchema } from "../../ags/v2_0";

export const ContentItemTypeSchema = z.enum(["file", "html", "image", "link", "ltiResourceLink"]);

export const DeepLinkingSettingsSchema = strictObject({
  deepLinkReturnUrl: UrlSchema,
  acceptTypes: z.array(ContentItemTypeSchema).min(1),
  acceptPresentationDocumentTargets: z.array(z.enum(["embed", "frame", "iframe", "popup", "tab", "window"])).optional(),
  acceptMediaTypes: z.union([NonEmptyStringSchema, z.array(NonEmptyStringSchema).min(1)]).optional(),
  acceptMultiple: z.boolean().optional(),
  autoCreate: z.boolean().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  data: z.string().optional(),
});

export const DeepLinkingRequestSchema = strictObject({
  messageType: z.literal("LtiDeepLinkingRequest"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema,
  deepLinkingSettings: DeepLinkingSettingsSchema,
  subject: NonEmptyStringSchema.optional(),
  resourceLink: ResourceLinkSchema.optional(),
  context: ContextSchema.optional(),
  roles: RolesSchema.optional(),
  lis: LisSchema.optional(),
  launchPresentation: LaunchPresentationSchema.optional(),
  custom: CustomParametersSchema.optional(),
});

export const ContentItemSchema = strictObject({
  type: ContentItemTypeSchema,
  title: z.string().optional(),
  text: z.string().optional(),
  url: UrlSchema.optional(),
  custom: CustomParametersSchema.optional(),
  icon: ImageResourceSchema.optional(),
  thumbnail: ImageResourceSchema.optional(),
  lineItem: LineItemSchema.optional(),
});

export const DeepLinkingResponseSchema = strictObject({
  messageType: z.literal("LtiDeepLinkingResponse"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema.optional(),
  contentItems: z.array(ContentItemSchema).min(1),
  data: z.string().optional(),
  message: z.string().optional(),
  log: z.string().optional(),
  errorMessage: z.string().optional(),
  errorLog: z.string().optional(),
});

export const LtiDeepLinkingV2_0 = {
  Schemas: {
    ContentItemType: ContentItemTypeSchema,
    DeepLinkingSettings: DeepLinkingSettingsSchema,
    DeepLinkingRequest: DeepLinkingRequestSchema,
    ContentItem: ContentItemSchema,
    DeepLinkingResponse: DeepLinkingResponseSchema,
  },
} as const;

export type LtiDeepLinkingV2_0Schemas = typeof LtiDeepLinkingV2_0.Schemas;

export const LtiDeepLinkingV2_0DerivedZodTemplates = {
  description: "LTI Deep Linking v2.0 Zod schemas for normalized request settings and response content items",
  specLinks: {
    main: "https://www.imsglobal.org/spec/lti-dl/v2p0/",
  },
  scope: "Deep linking request settings and response content items",
  claims: ["deep_linking_settings", "content_items"],
  notes: [
    "Accept-media-types is intentionally permissive because implementations vary between comma-delimited strings and arrays.",
    "Content items reuse the AGS line-item schema when a deep-linked resource declares grading metadata.",
  ],
} as const;
// Inferred types from exported Zod validators.
export type ContentItemType = z.infer<typeof ContentItemTypeSchema>;
export type DeepLinkingSettings = z.infer<typeof DeepLinkingSettingsSchema>;
export type DeepLinkingRequest = z.infer<typeof DeepLinkingRequestSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type DeepLinkingResponse = z.infer<typeof DeepLinkingResponseSchema>;
