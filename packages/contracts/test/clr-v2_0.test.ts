import { expect, test } from "bun:test";

import { ClrV2_0 } from "../src";

test("ClrCredentialSchema parses a realistic CLR 2.0 credential", () => {
  const parsed = ClrV2_0.ClrCredentialSchema.safeParse({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json",
    ],
    id: "http://example.edu/credentials/3732",
    type: ["VerifiableCredential", "ClrCredential"],
    issuer: {
      id: "https://example.edu/issuers/565049",
      type: ["Profile"],
      name: "Example University",
    },
    validFrom: "2010-01-01T00:00:00Z",
    name: "Sample Transcript",
    credentialSubject: {
      id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
      type: ["ClrSubject"],
      verifiableCredential: [
        {
          "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
          ],
          id: "http://example.com/credentials/3527",
          type: ["VerifiableCredential", "OpenBadgeCredential"],
          issuer: {
            id: "https://example.com/issuers/876543",
            type: ["Profile"],
            name: "Example Corp",
          },
          validFrom: "2010-01-01T00:00:00Z",
          credentialSubject: {
            id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
            achievement: {
              id: "https://example.com/achievements/21st-century-skills/teamwork",
              type: ["Achievement"],
              criteria: {
                narrative: "Team members are nominated for this badge by their peers and recognized after review.",
              },
              description: "This badge recognizes the capacity to collaborate within a group environment.",
              name: "Teamwork",
            },
          },
          proof: [
            {
              type: "DataIntegrityProof",
              created: "2024-03-21T18:13:02Z",
              verificationMethod: "https://example.com/issuers/876543#z6MkvREVgsHx7Ppae68vCoByy73ZD4aMSJiPML2cryVL8JAx",
              cryptosuite: "eddsa-rdfc-2022",
              proofPurpose: "assertionMethod",
              proofValue: "z5rBXds3Efc6Ks8b4gLqBqFZTnFJM9a6ZeMFTbULckDohcpW4zS4dNP33iDvi6Qej4uJ4vzHvR3wRUSw8ykMS1bR1",
            },
          ],
        },
      ],
      achievement: [
        {
          id: "urn:uuid:a7467ef6-56cb-11ec-bf63-0242ac130002",
          type: ["Achievement"],
          creator: {
            id: "https://example.edu/issuers/565049",
            type: ["Profile"],
          },
          name: "Achievement 1",
          criteria: {
            id: "https://example.edu/achievements/a7467ef6-56cb-11ec-bf63-0242ac130002/criteria",
          },
          description: "Achievement 1",
        },
      ],
      association: [
        {
          type: "Association",
          associationType: "isParentOf",
          sourceId: "urn:uuid:a7467ef6-56cb-11ec-bf63-0242ac130002",
          targetId: "urn:uuid:dd887f0a-56cb-11ec-bf63-0242ac130002",
        },
      ],
    },
    credentialSchema: [
      {
        id: "https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_clrcredential_schema.json",
        type: "1EdTechJsonSchemaValidator2019",
      },
    ],
    proof: [
      {
        type: "DataIntegrityProof",
        created: "2010-01-01T19:23:24Z",
        verificationMethod: "https://example.edu/issuers/565049#z6MkjZRZv3aez3r18pB1RBFJR1kwUVJ5jHt92JmQwXbd5hwi",
        cryptosuite: "eddsa-rdfc-2022",
        proofPurpose: "assertionMethod",
        proofValue: "z3d7QnJK9rH5H8ARTViDA8oygpawXzqZxY6DwdizBo19rmMWDLKDGwHyF4whGm2WZv7PRNmiw9mmGDjTWoVKXCoWj",
      },
    ],
  });

  expect(parsed.success).toBe(true);
});

test("AchievementCredentialSchema parses a minimal achievement credential", () => {
  const parsed = ClrV2_0.AchievementCredentialSchema.safeParse({
    "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"],
    id: "https://example.test/credentials/achievement-1",
    type: ["VerifiableCredential", "AchievementCredential"],
    issuer: {
      id: "https://example.test/issuers/1",
      type: ["Profile"],
      name: "Example Issuer",
    },
    validFrom: "2025-01-01T00:00:00Z",
    credentialSubject: {
      type: ["AchievementSubject"],
      achievement: {
        id: "https://example.test/achievements/1",
        type: ["Achievement"],
        name: "Example Achievement",
        description: "Awarded for completing the example pathway.",
        criteria: {
          narrative: "Complete every required task.",
        },
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("ProfileSchema parses a minimal issuer profile", () => {
  const parsed = ClrV2_0.ProfileSchema.safeParse({
    id: "https://example.test/issuers/1",
    type: ["Profile"],
    name: "Example Issuer",
    url: "https://example.test",
  });

  expect(parsed.success).toBe(true);
});

test("GetClrCredentialsResponseSchema parses credential and JWS collections", () => {
  const parsed = ClrV2_0.GetClrCredentialsResponseSchema.safeParse({
    credential: {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      ],
      id: "https://example.test/credentials/1",
      type: ["VerifiableCredential", "ClrCredential"],
      issuer: {
        id: "https://example.test/issuers/1",
        type: ["Profile"],
      },
      validFrom: "2025-01-01T00:00:00Z",
      name: "Example CLR",
      credentialSubject: {
        type: ["ClrSubject"],
        verifiableCredential: {
          "@context": ["https://www.w3.org/ns/credentials/v2"],
          type: "VerifiableCredential",
          issuer: "https://example.test/issuers/1",
          validFrom: "2025-01-01T00:00:00Z",
          credentialSubject: {
            id: "did:example:student-1",
          },
        },
      },
    },
    compactJwsString: "header.payload.signature",
  });

  expect(parsed.success).toBe(true);
});

test("ImsxStatusInfoSchema enforces known status vocabularies", () => {
  const parsed = ClrV2_0.ImsxStatusInfoSchema.safeParse({
    imsx_codeMajor: "success",
    imsx_severity: "status",
    imsx_description: "Request completed successfully",
    imsx_codeMinor: {
      imsx_codeMinorField: {
        imsx_codeMinorFieldName: "clr-service",
        imsx_codeMinorFieldValue: "fullsuccess",
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("ClrCredentialSchema rejects credentials without the CLR context set", () => {
  const parsed = ClrV2_0.ClrCredentialSchema.safeParse({
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "https://example.test/credentials/1",
    type: ["VerifiableCredential", "ClrCredential"],
    issuer: "https://example.test/issuers/1",
    validFrom: "2025-01-01T00:00:00Z",
    name: "Example CLR",
    credentialSubject: {
      type: ["ClrSubject"],
      verifiableCredential: {
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        type: "VerifiableCredential",
        issuer: "https://example.test/issuers/1",
        validFrom: "2025-01-01T00:00:00Z",
        credentialSubject: {},
      },
    },
  });

  expect(parsed.success).toBe(false);
});

test("Clr20DerivedZodTemplates exposes the published entry points", () => {
  expect(ClrV2_0.Clr20DerivedZodTemplates.clrCredential).toBe(ClrV2_0.ClrCredentialSchema);
  expect(ClrV2_0.Clr20DerivedZodTemplates.profile).toBe(ClrV2_0.ProfileSchema);
  expect(ClrV2_0.Clr20DerivedZodTemplates.imsxStatusInfo).toBe(ClrV2_0.ImsxStatusInfoSchema);
});
