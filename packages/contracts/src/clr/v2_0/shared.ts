import { z } from "zod";

import {
  AchievementCredentialSchema,
  AchievementSchema,
  AchievementSubjectSchema,
  AchievementTypeSchema,
  AddressSchema,
  AlignmentSchema,
  AlignmentTargetTypeSchema,
  CriteriaSchema,
  CredentialSubjectSchema,
  CredentialSchemaSchema,
  CredentialStatusSchema,
  EndorsementCredentialSchema,
  EndorsementSubjectSchema,
  EvidenceSchema,
  GeoCoordinatesSchema,
  IdentifierEntrySchema,
  IdentifierTypeEnumSchema,
  IdentityObjectSchema,
  ImageSchema,
  OpenBadgesV30ContextUrlSchema,
  ProfileRefSchema,
  ProfileSchema,
  ProofSchema,
  RefreshServiceSchema,
  RelatedSchema,
  ResultDescriptionSchema,
  ResultSchema,
  ResultStatusTypeSchema,
  ResultTypeSchema,
  RubricCriterionLevelSchema,
  TermsOfUseSchema,
} from "../../open-badges/v3_0/shared";
import {
  CompactJwsValueSchema,
  contextArraySchema,
  credentialTypeSchema,
  oneOrMany,
  type OneOrManyValue,
  passthroughObject,
  singleTypeSchema,
  TextValueSchema,
  type TextValue,
  UriValueSchema,
  type UriValue,
  W3cCredentialsV2ContextSchema,
} from "../../vc-data-model/v2_0/shared";

type ClrSubject = {
  id?: UriValue | undefined;
  type: unknown;
  identifier?: OneOrManyValue<Record<string, unknown>> | undefined;
  achievement?: OneOrManyValue<Record<string, unknown>> | undefined;
  verifiableCredential: OneOrManyValue<Record<string, unknown>>;
  association?: OneOrManyValue<Record<string, unknown>> | undefined;
  [key: string]: unknown;
};

type ClrCredential = {
  "@context": Array<Record<string, unknown> | UriValue>;
  type: unknown;
  id: UriValue;
  name: TextValue;
  description?: TextValue | undefined;
  endorsement?: OneOrManyValue<Record<string, unknown>> | undefined;
  endorsementJwt?: OneOrManyValue<string | Record<string, string>> | undefined;
  image?: Record<string, unknown> | undefined;
  partial?: boolean | undefined;
  credentialSubject: ClrSubject;
  awardedDate?: string | undefined;
  issuer: UriValue | Record<string, unknown>;
  validFrom: string;
  validUntil?: string | undefined;
  proof?: OneOrManyValue<Record<string, unknown>> | undefined;
  credentialSchema?: OneOrManyValue<Record<string, unknown>> | undefined;
  credentialStatus?: Record<string, unknown> | undefined;
  refreshService?: Record<string, unknown> | undefined;
  termsOfUse?: OneOrManyValue<Record<string, unknown>> | undefined;
  evidence?: OneOrManyValue<Record<string, unknown>> | undefined;
  [key: string]: unknown;
};

const ClrV20ContextUrlSchema = z
  .string()
  .regex(/^https:\/\/purl\.imsglobal\.org\/spec\/clr\/v2p0\/context(-2\.\d\.\d)*\.json$/u);

const ClrCredentialContextSchema = contextArraySchema("CLR 2.0", [
  W3cCredentialsV2ContextSchema,
  ClrV20ContextUrlSchema,
  OpenBadgesV30ContextUrlSchema,
]);

export const AssociationTypeSchema = z.enum([
  "exactMatchOf",
  "isChildOf",
  "isParentOf",
  "isPartOf",
  "isPeerOf",
  "isRelatedTo",
  "precedes",
  "replacedBy",
]);

export const AssociationSchema = passthroughObject({
  type: singleTypeSchema("Association"),
  associationType: AssociationTypeSchema,
  sourceId: UriValueSchema,
  targetId: UriValueSchema,
});

export const VerifiableCredentialSchema = passthroughObject({
  "@context": contextArraySchema("CLR 2.0", [W3cCredentialsV2ContextSchema]),
  id: UriValueSchema.optional(),
  type: singleTypeSchema("VerifiableCredential"),
  issuer: ProfileRefSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().optional(),
  credentialSubject: passthroughObject({
    id: UriValueSchema.optional(),
  }),
  proof: oneOrMany(ProofSchema).optional(),
  credentialSchema: oneOrMany(CredentialSchemaSchema).optional(),
  credentialStatus: CredentialStatusSchema.optional(),
  refreshService: RefreshServiceSchema.optional(),
  termsOfUse: oneOrMany(TermsOfUseSchema).optional(),
  evidence: oneOrMany(EvidenceSchema).optional(),
});

export const ClrSubjectSchema: z.ZodType<ClrSubject> = passthroughObject({
  id: UriValueSchema.optional(),
  type: singleTypeSchema("ClrSubject"),
  identifier: oneOrMany(IdentityObjectSchema).optional(),
  achievement: oneOrMany(AchievementSchema).optional(),
  verifiableCredential: oneOrMany(VerifiableCredentialSchema),
  association: oneOrMany(AssociationSchema).optional(),
});

export const ClrCredentialSchema: z.ZodType<ClrCredential> = passthroughObject({
  "@context": ClrCredentialContextSchema,
  type: credentialTypeSchema(["ClrCredential"]),
  id: UriValueSchema,
  name: TextValueSchema,
  description: TextValueSchema.optional(),
  endorsement: oneOrMany(EndorsementCredentialSchema).optional(),
  endorsementJwt: oneOrMany(CompactJwsValueSchema).optional(),
  image: ImageSchema.optional(),
  partial: z.boolean().optional(),
  credentialSubject: ClrSubjectSchema,
  awardedDate: z.iso.datetime().optional(),
  issuer: ProfileRefSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().optional(),
  proof: oneOrMany(ProofSchema).optional(),
  credentialSchema: oneOrMany(CredentialSchemaSchema).optional(),
  credentialStatus: CredentialStatusSchema.optional(),
  refreshService: RefreshServiceSchema.optional(),
  termsOfUse: oneOrMany(TermsOfUseSchema).optional(),
  evidence: oneOrMany(EvidenceSchema).optional(),
});

export const GetClrCredentialsResponseSchema = z
  .object({
    credential: oneOrMany(ClrCredentialSchema).optional(),
    compactJwsString: oneOrMany(CompactJwsValueSchema).optional(),
  })
  .strict();

export {
  AchievementCredentialSchema,
  AchievementSchema,
  AchievementSubjectSchema,
  AchievementTypeSchema,
  AddressSchema,
  AlignmentSchema,
  AlignmentTargetTypeSchema,
  CriteriaSchema,
  CredentialSubjectSchema,
  CredentialSchemaSchema,
  CredentialStatusSchema,
  EndorsementCredentialSchema,
  EndorsementSubjectSchema,
  EvidenceSchema,
  GeoCoordinatesSchema,
  IdentifierEntrySchema,
  IdentifierTypeEnumSchema,
  IdentityObjectSchema,
  ImageSchema,
  ProfileRefSchema,
  ProfileSchema,
  ProofSchema,
  RefreshServiceSchema,
  RelatedSchema,
  ResultDescriptionSchema,
  ResultSchema,
  ResultStatusTypeSchema,
  ResultTypeSchema,
  RubricCriterionLevelSchema,
  TermsOfUseSchema,
};
// Inferred types from exported Zod validators.
export type AssociationType = z.infer<typeof AssociationTypeSchema>;
export type Association = z.infer<typeof AssociationSchema>;
export type VerifiableCredential = z.infer<typeof VerifiableCredentialSchema>;
export type GetClrCredentialsResponse = z.infer<typeof GetClrCredentialsResponseSchema>;
