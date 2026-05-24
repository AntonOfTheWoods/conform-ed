import { expect, test } from "bun:test";

import { VcDataModelV2_0 } from "../src";

test("VerifiableCredentialSchema parses a minimal VC Data Model 2.0 credential", () => {
  const parsed = VcDataModelV2_0.VerifiableCredentialSchema.safeParse({
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    type: "VerifiableCredential",
    issuer: "https://example.test/issuers/1",
    validFrom: "2025-01-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:subject-1",
    },
  });

  expect(parsed.success).toBe(true);
});

test("VerifiablePresentationSchema parses a presentation carrying VC and JWS credentials", () => {
  const parsed = VcDataModelV2_0.VerifiablePresentationSchema.safeParse({
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    type: "VerifiablePresentation",
    holder: "did:example:holder-1",
    verifiableCredential: [
      {
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        type: "VerifiableCredential",
        issuer: "https://example.test/issuers/1",
        validFrom: "2025-01-01T00:00:00Z",
        credentialSubject: {
          id: "did:example:subject-1",
        },
      },
      "header.payload.signature",
    ],
  });

  expect(parsed.success).toBe(true);
});

test("VerifiableCredentialSchema rejects wrong core context", () => {
  const parsed = VcDataModelV2_0.VerifiableCredentialSchema.safeParse({
    "@context": ["https://example.test/context"],
    type: "VerifiableCredential",
    issuer: "https://example.test/issuers/1",
    validFrom: "2025-01-01T00:00:00Z",
    credentialSubject: {
      id: "did:example:subject-1",
    },
  });

  expect(parsed.success).toBe(false);
});

test("VcDataModel20DerivedZodTemplates exposes expected entry points", () => {
  expect(VcDataModelV2_0.VcDataModel20DerivedZodTemplates.verifiableCredential).toBe(
    VcDataModelV2_0.VerifiableCredentialSchema,
  );
  expect(VcDataModelV2_0.VcDataModel20DerivedZodTemplates.verifiablePresentation).toBe(
    VcDataModelV2_0.VerifiablePresentationSchema,
  );
  expect(VcDataModelV2_0.VcDataModel20DerivedZodTemplates.proof).toBe(VcDataModelV2_0.ProofSchema);
});
