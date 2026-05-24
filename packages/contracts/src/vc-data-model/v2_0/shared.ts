import { z } from "zod";

export const LocaleTagSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/u);
export const LocalizedStringMapSchema = z.record(LocaleTagSchema, z.string());
export const NonEmptyLocalizedStringMapSchema = z.record(LocaleTagSchema, z.string().min(1));
export const W3cCredentialsV2ContextSchema = z.literal("https://www.w3.org/ns/credentials/v2");
export const CompactJwsSchema = z.string().regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+$/u);

export type LocalizedStringMap = Record<string, string>;
export type TextValue = string | LocalizedStringMap;
export type UriValue = string | LocalizedStringMap;
export type CompactJwsValue = string | LocalizedStringMap;
export type JsonLdContextEntry = Record<string, unknown> | UriValue;
export type OneOrManyValue<T> = T | T[];

export const TextValueSchema = z.union([z.string(), LocalizedStringMapSchema]);
export const UriValueSchema = z.union([z.string().min(1), NonEmptyLocalizedStringMapSchema]);
export const CompactJwsValueSchema = z.union([CompactJwsSchema, z.record(LocaleTagSchema, CompactJwsSchema)]);
export const JsonLdContextEntrySchema = z.union([z.record(z.string(), z.unknown()), UriValueSchema]);

export function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

export function passthroughObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).passthrough();
}

export function oneOrMany<T extends z.ZodTypeAny>(schema: T) {
  return z.union([schema, z.array(schema).min(1)]);
}

export function addIssue(context: z.RefinementCtx, path: Array<string | number>, message: string) {
  context.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message,
  });
}

function valueMatchesLiteral(value: unknown, expected: string) {
  if (typeof value === "string") {
    return value === expected;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).some((entry) => entry === expected);
}

export function literalOrLocalizedLiteralSchema(expected: string) {
  return z.union([z.literal(expected), z.record(LocaleTagSchema, z.literal(expected))]);
}

export function localizedEnumValueSchema<T extends readonly [string, ...string[]]>(values: T) {
  const allowed = new Set(values);
  const message = `Expected one of: ${values.join(", ")}`;

  return z.union([
    z.string().refine((value) => allowed.has(value), { message }),
    z.record(
      LocaleTagSchema,
      z.string().refine((value) => allowed.has(value), {
        message,
      }),
    ),
  ]);
}

export function singleTypeSchema(expected: string) {
  return z.union([
    literalOrLocalizedLiteralSchema(expected),
    z
      .array(UriValueSchema)
      .min(1)
      .superRefine((values, context) => {
        if (!values.some((value) => valueMatchesLiteral(value, expected))) {
          addIssue(context, [], `Expected type array to include "${expected}"`);
        }
      }),
  ]);
}

export function credentialTypeSchema<T extends readonly [string, ...string[]]>(domainTypes: T) {
  return z
    .array(UriValueSchema)
    .min(2)
    .superRefine((values, context) => {
      if (!values.some((value) => valueMatchesLiteral(value, "VerifiableCredential"))) {
        addIssue(context, [], 'Expected type array to include "VerifiableCredential"');
      }

      if (!domainTypes.some((domainType) => values.some((value) => valueMatchesLiteral(value, domainType)))) {
        addIssue(context, [], `Expected type array to include one of: ${domainTypes.join(", ")}`);
      }
    });
}

export function contextArraySchema(label: string, requiredEntries: readonly z.ZodTypeAny[]) {
  return z
    .array(JsonLdContextEntrySchema)
    .min(requiredEntries.length)
    .superRefine((values, context) => {
      requiredEntries.forEach((schema, index) => {
        const result = schema.safeParse(values[index]);
        if (!result.success) {
          addIssue(context, [index], `${label} context entry ${index} does not match the expected shape`);
        }
      });
    });
}

const VerifiableCredentialContextSchema = contextArraySchema("VC Data Model 2.0", [W3cCredentialsV2ContextSchema]);
const VerifiablePresentationContextSchema = contextArraySchema("VC Data Model 2.0", [W3cCredentialsV2ContextSchema]);

export const CredentialSchemaSchema = passthroughObject({
  id: UriValueSchema,
  type: TextValueSchema,
});

export const CredentialStatusSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: TextValueSchema,
});

export const RefreshServiceSchema = passthroughObject({
  id: UriValueSchema,
  type: TextValueSchema,
});

export const TermsOfUseSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: TextValueSchema,
});

export const ProofSchema = passthroughObject({
  type: TextValueSchema,
  created: z.iso.datetime().optional(),
  cryptosuite: TextValueSchema.optional(),
  challenge: TextValueSchema.optional(),
  domain: TextValueSchema.optional(),
  nonce: TextValueSchema.optional(),
  proofPurpose: TextValueSchema.optional(),
  proofValue: TextValueSchema.optional(),
  verificationMethod: UriValueSchema.optional(),
});

export const EvidenceSchema = passthroughObject({
  id: UriValueSchema.optional(),
  type: TextValueSchema.optional(),
  narrative: TextValueSchema.optional(),
  name: TextValueSchema.optional(),
  description: TextValueSchema.optional(),
});

export const CredentialSubjectSchema = passthroughObject({
  id: UriValueSchema.optional(),
});

const GenericEntityReferenceSchema = z.union([UriValueSchema, z.record(z.string(), z.unknown())]);

export const VerifiableCredentialSchema = passthroughObject({
  "@context": VerifiableCredentialContextSchema,
  id: UriValueSchema.optional(),
  type: singleTypeSchema("VerifiableCredential"),
  issuer: GenericEntityReferenceSchema,
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime().optional(),
  credentialSubject: z.union([CredentialSubjectSchema, z.array(CredentialSubjectSchema).min(1)]),
  name: TextValueSchema.optional(),
  description: TextValueSchema.optional(),
  proof: oneOrMany(ProofSchema).optional(),
  credentialSchema: oneOrMany(CredentialSchemaSchema).optional(),
  credentialStatus: oneOrMany(CredentialStatusSchema).optional(),
  refreshService: oneOrMany(RefreshServiceSchema).optional(),
  termsOfUse: oneOrMany(TermsOfUseSchema).optional(),
  evidence: oneOrMany(EvidenceSchema).optional(),
});

export const HolderSchema = GenericEntityReferenceSchema;

export const VerifiablePresentationSchema = passthroughObject({
  "@context": VerifiablePresentationContextSchema,
  type: singleTypeSchema("VerifiablePresentation"),
  id: UriValueSchema.optional(),
  holder: HolderSchema.optional(),
  verifiableCredential: oneOrMany(z.union([VerifiableCredentialSchema, CompactJwsValueSchema])).optional(),
  proof: oneOrMany(ProofSchema).optional(),
});
