import { z } from "zod";

import {
  CompactJwsValueSchema,
  type CompactJwsValue,
  contextArraySchema,
  CredentialSchemaSchema,
  CredentialStatusSchema,
  credentialTypeSchema,
  type JsonLdContextEntry,
  localizedEnumValueSchema,
  oneOrMany,
  type OneOrManyValue,
  passthroughObject,
  ProofSchema,
  RefreshServiceSchema,
  singleTypeSchema,
  TermsOfUseSchema,
  TextValueSchema,
  type TextValue,
  UriValueSchema,
  type UriValue,
  W3cCredentialsV2ContextSchema,
} from "../../vc-data-model/v2_0/shared";

const OpenBadgesV30ContextUrlSchema = z
  .string()
  .regex(/^https:\/\/purl\.imsglobal\.org\/spec\/ob\/v3p0\/context(-3\.\d\.\d)*\.json$/u);

// Declared output of a zod schema (z.ZodType<...>): zod's `.optional()` infers `| undefined`, so this must too.
type Profile = {
  id: UriValue;
  type: unknown;
  name?: TextValue | undefined;
  url?: UriValue | undefined;
  phone?: TextValue | undefined;
  description?: TextValue | undefined;
  endorsement?: OneOrManyValue<EndorsementCredential> | undefined;
  endorsementJwt?: OneOrManyValue<CompactJwsValue> | undefined;
  image?: Record<string, unknown> | undefined;
  email?: TextValue | undefined;
  address?: Record<string, unknown> | undefined;
  otherIdentifier?: OneOrManyValue<Record<string, unknown>> | undefined;
  official?: TextValue | undefined;
  parentOrg?: Profile | undefined;
  familyName?: TextValue | undefined;
  givenName?: TextValue | undefined;
  additionalName?: TextValue | undefined;
  patronymicName?: TextValue | undefined;
  honorificPrefix?: TextValue | undefined;
  honorificSuffix?: TextValue | undefined;
  familyNamePrefix?: TextValue | undefined;
  dateOfBirth?: string | undefined;
  [key: string]: unknown;
};

type ProfileRef = Profile | UriValue;

// Declared output of a zod schema (z.ZodType<...>): zod's `.optional()` infers `| undefined`, so this must too.
type EndorsementCredential = {
  "@context": JsonLdContextEntry[];
  type: unknown;
  id: UriValue;
  name: TextValue;
  description?: TextValue | undefined;
  credentialSubject: Record<string, unknown>;
  awardedDate?: string | undefined;
  issuer: ProfileRef;
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

const IDENTIFIER_TYPES = [
  "name",
  "sourcedId",
  "systemId",
  "productId",
  "userName",
  "accountId",
  "emailAddress",
  "nationalIdentityNumber",
  "isbn",
  "issn",
  "lisSourcedId",
  "oneRosterSourcedId",
  "sisSourcedId",
  "ltiContextId",
  "ltiDeploymentId",
  "ltiToolId",
  "ltiPlatformId",
  "ltiUserId",
  "identifier",
] as const;

const ACHIEVEMENT_TYPES = [
  "Achievement",
  "ApprenticeshipCertificate",
  "Assessment",
  "Assignment",
  "AssociateDegree",
  "Award",
  "Badge",
  "BachelorDegree",
  "Certificate",
  "CertificateOfCompletion",
  "Certification",
  "CommunityService",
  "Competency",
  "Course",
  "CoCurricular",
  "Degree",
  "Diploma",
  "DoctoralDegree",
  "Fieldwork",
  "GeneralEducationDevelopment",
  "JourneymanCertificate",
  "LearningProgram",
  "License",
  "Membership",
  "ProfessionalDoctorate",
  "QualityAssuranceCredential",
  "MasterCertificate",
  "MasterDegree",
  "MicroCredential",
  "ResearchDoctorate",
  "SecondarySchoolDiploma",
] as const;

const ALIGNMENT_TARGET_TYPES = [
  "ceasn:Competency",
  "ceterms:Credential",
  "CFItem",
  "CFRubric",
  "CFRubricCriterion",
  "CFRubricCriterionLevel",
  "CTDL",
] as const;

const RESULT_TYPES = [
  "GradePointAverage",
  "LetterGrade",
  "Percent",
  "PerformanceLevel",
  "PredictedScore",
  "RawScore",
  "Result",
  "RubricCriterion",
  "RubricCriterionLevel",
  "RubricScore",
  "ScaledScore",
  "Status",
] as const;

const RESULT_STATUSES = ["Completed", "Enrolled", "Failed", "InProgress", "OnHold", "Provisional", "Withdrew"] as const;

export const IdentifierTypeEnumSchema = z.enum(IDENTIFIER_TYPES);
export const AchievementTypeSchema = z.enum(ACHIEVEMENT_TYPES);
export const AlignmentTargetTypeSchema = z.enum(ALIGNMENT_TARGET_TYPES);
export const ResultTypeSchema = z.enum(RESULT_TYPES);
export const ResultStatusTypeSchema = z.enum(RESULT_STATUSES);

export const OpenBadgesAchievementCredentialContextSchema = contextArraySchema("Open Badges 3.0", [
  W3cCredentialsV2ContextSchema,
  OpenBadgesV30ContextUrlSchema,
]);

export const OpenBadgesEndorsementCredentialContextSchema = contextArraySchema("Open Badges 3.0", [
  W3cCredentialsV2ContextSchema,
  OpenBadgesV30ContextUrlSchema,
]);

export const OpenBadgesVerifiableCredentialContextSchema = contextArraySchema("Open Badges 3.0", [
  W3cCredentialsV2ContextSchema,
]);

export const ImageSchema = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("Image"),
  caption: TextValueSchema.optional(),
});

export const GeoCoordinatesSchema = passthroughObject({
  type: singleTypeSchema("GeoCoordinates"),
  latitude: z.number(),
  longitude: z.number(),
});

export const AddressSchema = passthroughObject({
  type: singleTypeSchema("Address"),
  addressCountry: TextValueSchema.optional(),
  addressCountryCode: TextValueSchema.optional(),
  addressRegion: TextValueSchema.optional(),
  addressLocality: TextValueSchema.optional(),
  streetAddress: TextValueSchema.optional(),
  postOfficeBoxNumber: TextValueSchema.optional(),
  postalCode: TextValueSchema.optional(),
  geo: GeoCoordinatesSchema.optional(),
});

export const IdentifierEntrySchema = passthroughObject({
  type: singleTypeSchema("IdentifierEntry"),
  identifier: TextValueSchema,
  identifierType: localizedEnumValueSchema(IDENTIFIER_TYPES),
});

export const CriteriaSchema = passthroughObject({
  id: UriValueSchema.optional(),
  narrative: TextValueSchema.optional(),
});

export const AlignmentSchema = passthroughObject({
  type: singleTypeSchema("Alignment"),
  targetCode: TextValueSchema.optional(),
  targetDescription: TextValueSchema.optional(),
  targetName: TextValueSchema,
  targetFramework: TextValueSchema.optional(),
  targetType: localizedEnumValueSchema(ALIGNMENT_TARGET_TYPES).optional(),
  targetUrl: UriValueSchema,
});

export const RelatedSchema = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("Related"),
  inLanguage: TextValueSchema.optional(),
  version: TextValueSchema.optional(),
});

export const RubricCriterionLevelSchema = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("RubricCriterionLevel"),
  alignment: oneOrMany(AlignmentSchema).optional(),
  description: TextValueSchema.optional(),
  level: TextValueSchema.optional(),
  name: TextValueSchema.optional(),
  points: TextValueSchema.optional(),
});

export const ResultDescriptionSchema = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("ResultDescription"),
  alignment: oneOrMany(AlignmentSchema).optional(),
  allowedValue: oneOrMany(TextValueSchema).optional(),
  name: TextValueSchema,
  requiredLevel: TextValueSchema.optional(),
  requiredValue: TextValueSchema.optional(),
  resultType: localizedEnumValueSchema(RESULT_TYPES),
  rubricCriterionLevel: oneOrMany(RubricCriterionLevelSchema).optional(),
  valueMax: TextValueSchema.optional(),
  valueMin: TextValueSchema.optional(),
});

export const EvidenceSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: singleTypeSchema("Evidence"),
  narrative: TextValueSchema.optional(),
  name: TextValueSchema.optional(),
  description: TextValueSchema.optional(),
  genre: TextValueSchema.optional(),
  audience: TextValueSchema.optional(),
});

export const EndorsementSubjectSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: singleTypeSchema("EndorsementSubject"),
  endorsementComment: TextValueSchema.optional(),
});

export const CredentialSubjectSchema = passthroughObject({
  id: UriValueSchema.optional(),
});

export const ProfileSchema: z.ZodType<Profile> = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("Profile"),
  name: TextValueSchema.optional(),
  url: UriValueSchema.optional(),
  phone: TextValueSchema.optional(),
  description: TextValueSchema.optional(),
  endorsement: z.lazy(() => oneOrMany(EndorsementCredentialSchema)).optional(),
  endorsementJwt: oneOrMany(CompactJwsValueSchema).optional(),
  image: ImageSchema.optional(),
  email: TextValueSchema.optional(),
  address: AddressSchema.optional(),
  otherIdentifier: oneOrMany(IdentifierEntrySchema).optional(),
  official: TextValueSchema.optional(),
  parentOrg: z.lazy(() => ProfileSchema).optional(),
  familyName: TextValueSchema.optional(),
  givenName: TextValueSchema.optional(),
  additionalName: TextValueSchema.optional(),
  patronymicName: TextValueSchema.optional(),
  honorificPrefix: TextValueSchema.optional(),
  honorificSuffix: TextValueSchema.optional(),
  familyNamePrefix: TextValueSchema.optional(),
  dateOfBirth: z.iso.date().optional(),
});

export const ProfileRefSchema: z.ZodType<ProfileRef> = z.lazy(() => z.union([ProfileSchema, UriValueSchema]));

export const EndorsementCredentialSchema: z.ZodType<EndorsementCredential> = passthroughObject({
  "@context": OpenBadgesEndorsementCredentialContextSchema,
  type: credentialTypeSchema(["EndorsementCredential"]),
  id: UriValueSchema,
  name: TextValueSchema,
  description: TextValueSchema.optional(),
  credentialSubject: EndorsementSubjectSchema,
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

export const AchievementSchema = passthroughObject({
  id: UriValueSchema,
  type: singleTypeSchema("Achievement"),
  alignment: oneOrMany(AlignmentSchema).optional(),
  achievementType: localizedEnumValueSchema(ACHIEVEMENT_TYPES).optional(),
  creator: ProfileSchema.optional(),
  creditsAvailable: z.number().optional(),
  criteria: CriteriaSchema,
  description: TextValueSchema,
  endorsement: oneOrMany(EndorsementCredentialSchema).optional(),
  endorsementJwt: oneOrMany(CompactJwsValueSchema).optional(),
  fieldOfStudy: TextValueSchema.optional(),
  humanCode: TextValueSchema.optional(),
  image: ImageSchema.optional(),
  inLanguage: TextValueSchema.optional(),
  name: TextValueSchema,
  otherIdentifier: oneOrMany(IdentifierEntrySchema).optional(),
  related: oneOrMany(RelatedSchema).optional(),
  resultDescription: oneOrMany(ResultDescriptionSchema).optional(),
  specialization: TextValueSchema.optional(),
  tag: oneOrMany(TextValueSchema).optional(),
  version: TextValueSchema.optional(),
});

export const IdentityObjectSchema = passthroughObject({
  type: singleTypeSchema("IdentityObject"),
  hashed: z.boolean().optional(),
  identityHash: TextValueSchema.optional(),
  identityType: localizedEnumValueSchema(IDENTIFIER_TYPES).optional(),
  salt: TextValueSchema.optional(),
});

export const ResultSchema = passthroughObject({
  type: singleTypeSchema("Result"),
  achievedLevel: TextValueSchema.optional(),
  alignment: oneOrMany(AlignmentSchema).optional(),
  resultDescription: TextValueSchema.optional(),
  status: ResultStatusTypeSchema.optional(),
  value: TextValueSchema.optional(),
});

export const AchievementSubjectSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: singleTypeSchema("AchievementSubject"),
  activityEndDate: z.iso.date().optional(),
  activityStartDate: z.iso.date().optional(),
  creditsEarned: z.number().optional(),
  achievement: AchievementSchema,
  identifier: oneOrMany(IdentityObjectSchema).optional(),
  image: ImageSchema.optional(),
  licenseNumber: TextValueSchema.optional(),
  narrative: TextValueSchema.optional(),
  result: oneOrMany(ResultSchema).optional(),
  role: TextValueSchema.optional(),
  source: ProfileSchema.optional(),
  term: TextValueSchema.optional(),
});

export const AchievementCredentialSchema = passthroughObject({
  "@context": OpenBadgesAchievementCredentialContextSchema,
  id: UriValueSchema,
  type: credentialTypeSchema(["AchievementCredential", "OpenBadgeCredential"]),
  name: TextValueSchema.optional(),
  description: TextValueSchema.optional(),
  image: ImageSchema.optional(),
  awardedDate: z.iso.datetime().optional(),
  credentialSubject: AchievementSubjectSchema,
  endorsement: oneOrMany(EndorsementCredentialSchema).optional(),
  endorsementJwt: oneOrMany(CompactJwsValueSchema).optional(),
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

export const OpenBadgeCredentialSchema = AchievementCredentialSchema;

export const VerifiableCredentialSchema = passthroughObject({
  "@context": OpenBadgesVerifiableCredentialContextSchema,
  id: UriValueSchema.optional(),
  type: singleTypeSchema("VerifiableCredential"),
  issuer: ProfileRefSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().optional(),
  credentialSubject: CredentialSubjectSchema,
  proof: oneOrMany(ProofSchema).optional(),
  credentialSchema: oneOrMany(CredentialSchemaSchema).optional(),
  credentialStatus: CredentialStatusSchema.optional(),
  refreshService: RefreshServiceSchema.optional(),
  termsOfUse: oneOrMany(TermsOfUseSchema).optional(),
  evidence: oneOrMany(EvidenceSchema).optional(),
});

export const GetOpenBadgeCredentialsResponseSchema = z
  .object({
    credential: oneOrMany(AchievementCredentialSchema).optional(),
    compactJwsString: oneOrMany(CompactJwsValueSchema).optional(),
  })
  .strict();

export { OpenBadgesV30ContextUrlSchema };
export { CredentialSchemaSchema, CredentialStatusSchema, ProofSchema, RefreshServiceSchema, TermsOfUseSchema };
// Inferred types from exported Zod validators.
export type IdentifierTypeEnum = z.infer<typeof IdentifierTypeEnumSchema>;
export type AchievementType = z.infer<typeof AchievementTypeSchema>;
export type AlignmentTargetType = z.infer<typeof AlignmentTargetTypeSchema>;
export type ResultType = z.infer<typeof ResultTypeSchema>;
export type ResultStatusType = z.infer<typeof ResultStatusTypeSchema>;
export type OpenBadgesAchievementCredentialContext = z.infer<typeof OpenBadgesAchievementCredentialContextSchema>;
export type OpenBadgesEndorsementCredentialContext = z.infer<typeof OpenBadgesEndorsementCredentialContextSchema>;
export type OpenBadgesVerifiableCredentialContext = z.infer<typeof OpenBadgesVerifiableCredentialContextSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type GeoCoordinates = z.infer<typeof GeoCoordinatesSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type IdentifierEntry = z.infer<typeof IdentifierEntrySchema>;
export type Criteria = z.infer<typeof CriteriaSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type Related = z.infer<typeof RelatedSchema>;
export type RubricCriterionLevel = z.infer<typeof RubricCriterionLevelSchema>;
export type ResultDescription = z.infer<typeof ResultDescriptionSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type EndorsementSubject = z.infer<typeof EndorsementSubjectSchema>;
export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type IdentityObject = z.infer<typeof IdentityObjectSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type AchievementSubject = z.infer<typeof AchievementSubjectSchema>;
export type AchievementCredential = z.infer<typeof AchievementCredentialSchema>;
export type OpenBadgeCredential = z.infer<typeof OpenBadgeCredentialSchema>;
export type VerifiableCredential = z.infer<typeof VerifiableCredentialSchema>;
export type GetOpenBadgeCredentialsResponse = z.infer<typeof GetOpenBadgeCredentialsResponseSchema>;
