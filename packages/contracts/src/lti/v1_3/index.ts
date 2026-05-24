export * from "../shared";

import { z } from "zod";

import {
  ContextSchema,
  CustomParametersSchema,
  LaunchPresentationSchema,
  LisSchema,
  NonEmptyStringSchema,
  ResourceLinkSchema,
  RolesSchema,
  UrlSchema,
  LtiVersionSchema,
  strictObject,
} from "../shared";

export const CoreLaunchRequestSchema = strictObject({
  messageType: z.literal("LtiResourceLinkRequest"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema,
  targetLinkUri: UrlSchema,
  resourceLink: ResourceLinkSchema,
  subject: NonEmptyStringSchema,
  context: ContextSchema.optional(),
  roles: RolesSchema,
  lis: LisSchema.optional(),
  launchPresentation: LaunchPresentationSchema.optional(),
  custom: CustomParametersSchema.optional(),
  name: NonEmptyStringSchema.optional(),
  givenName: NonEmptyStringSchema.optional(),
  familyName: NonEmptyStringSchema.optional(),
  email: z.string().email().optional(),
  locale: NonEmptyStringSchema.optional(),
});

export const CoreLaunchClaimsSchema = CoreLaunchRequestSchema;

export namespace LtiV1_3 {
  export namespace Schemas {
    export const ResourceLink = ResourceLinkSchema;
    export const Context = ContextSchema;
    export const LaunchPresentation = LaunchPresentationSchema;
    export const Lis = LisSchema;
    export const CoreLaunchRequest = CoreLaunchRequestSchema;
    export const CoreLaunchClaims = CoreLaunchClaimsSchema;
  }

  export namespace Shared {
    export const Version = LtiVersionSchema;
    export const Url = UrlSchema;
    export const NonEmptyString = NonEmptyStringSchema;
    export const Roles = RolesSchema;
  }
}

export type LtiV1_3Schemas = typeof LtiV1_3.Schemas;

export const Lti13DerivedZodTemplates = {
  description: "LTI 1.3 Core Zod schemas for normalized launch claims and launch-shaped objects",
  specLinks: {
    main: "https://www.imsglobal.org/spec/lti/v1p3/",
    claims: "https://www.imsglobal.org/spec/lti/v1p3/#message-claims",
  },
  scope: "LTI 1.3 resource-link launch claims",
  claims: [
    "messageType",
    "version",
    "deploymentId",
    "targetLinkUri",
    "resourceLink",
    "context",
    "roles",
    "lis",
    "launchPresentation",
  ],
  notes: [
    "Normalized camelCase field names are used instead of raw JWT claim URIs.",
    "Identity fields remain optional beyond the subject claim to keep the schema useful for adapter stubs and launch fixtures.",
  ],
} as const;
