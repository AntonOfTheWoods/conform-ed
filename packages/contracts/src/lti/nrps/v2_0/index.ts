export * from "../../shared";

import { z } from "zod";

import { NonEmptyStringSchema, UrlSchema, UriReferenceSchema, strictObject } from "../../shared";

export const MembershipStatusSchema = z.enum(["Active", "Deleted", "Inactive"]);

export const MembershipContextSchema = strictObject({
  id: NonEmptyStringSchema,
  label: NonEmptyStringSchema.optional(),
  title: NonEmptyStringSchema.optional(),
});

export const NamesRoleServiceSchema = strictObject({
  contextMembershipsUrl: UrlSchema,
  serviceVersions: z.array(z.literal("2.0")).min(1),
});

export const MembershipSchema = strictObject({
  status: MembershipStatusSchema.optional(),
  name: z.string().optional(),
  picture: UrlSchema.optional(),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  middleName: z.string().optional(),
  email: z.string().email().optional(),
  userId: NonEmptyStringSchema,
  lisPersonSourcedId: NonEmptyStringSchema.optional(),
  roles: z.array(UriReferenceSchema).min(1),
  roleScopeMentor: z.array(UriReferenceSchema).min(1).optional(),
});

export const MembershipContainerSchema = strictObject({
  id: UrlSchema,
  context: MembershipContextSchema,
  members: z.array(MembershipSchema).min(1),
});

export namespace LtiNrpsV2_0 {
  export namespace Schemas {
    export const NamesRoleService = NamesRoleServiceSchema;
    export const Membership = MembershipSchema;
    export const MembershipContainer = MembershipContainerSchema;
    export const MembershipContext = MembershipContextSchema;
    export const MembershipStatus = MembershipStatusSchema;
  }
}

export type LtiNrpsV2_0Schemas = typeof LtiNrpsV2_0.Schemas;

export const LtiNrpsV2_0DerivedZodTemplates = {
  description: "LTI NRPS v2.0 Zod schemas for normalized names/roles service and membership container payloads",
  specLinks: {
    main: "https://www.imsglobal.org/spec/lti-nrps/v2p0/",
  },
  scope: "Names and Roles Provisioning Service claim and membership container",
  claims: ["namesroleservice"],
  notes: [
    "Member records keep the required userId and roles fields strict while leaving consented personal data optional.",
    "The membership container matches the normalized JSON shape used by the adapter reference app.",
  ],
} as const;
// Inferred types from exported Zod validators.
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;
export type MembershipContext = z.infer<typeof MembershipContextSchema>;
export type NamesRoleService = z.infer<typeof NamesRoleServiceSchema>;
export type Membership = z.infer<typeof MembershipSchema>;
export type MembershipContainer = z.infer<typeof MembershipContainerSchema>;
