import { expect, test } from "bun:test";

import { OpenBadgesV3_0 } from "../src";

test("AchievementCredentialSchema parses a realistic Open Badge credential", () => {
  const parsed = OpenBadgesV3_0.AchievementCredentialSchema.safeParse({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json",
    ],
    id: "http://example.edu/credentials/3732",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: "https://example.edu/issuers/565049",
      type: ["Profile"],
      name: "Example University",
    },
    validFrom: "2010-01-01T00:00:00Z",
    name: "Example University Degree",
    credentialSubject: {
      id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
      type: ["AchievementSubject"],
      achievement: {
        id: "https://example.com/achievements/21st-century-skills/teamwork",
        type: ["Achievement"],
        criteria: {
          narrative: "Team members are nominated for this badge by peers and recognized upon management review.",
        },
        description: "This badge recognizes collaboration capacity in group environments.",
        name: "Teamwork",
      },
    },
    credentialSchema: [
      {
        id: "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json",
        type: "1EdTechJsonSchemaValidator2019",
      },
    ],
    proof: {
      type: "DataIntegrityProof",
      created: "2010-01-01T19:23:24Z",
      verificationMethod: "https://example.edu/issuers/565049#z6MkjZRsdasZv3aez3r18pB1RBFJR1kwUVJ5jHt92JmQwXbd5hwi",
      cryptosuite: "eddsa-rdfc-2022",
      proofPurpose: "assertionMethod",
      proofValue: "z4HwAsa7GvwL7so7CoQ8v3ShzykRPCq8pfkAFKuAPrJx28S69pXphpqL8ApjoxEcMaqbgkaCUyKuEohhGXBR4Fh3L",
    },
  });

  expect(parsed.success).toBe(true);
});

test("EndorsementCredentialSchema parses a valid endorsement credential", () => {
  const parsed = OpenBadgesV3_0.EndorsementCredentialSchema.safeParse({
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json",
    ],
    id: "http://example.edu/endorsementcredential/3732",
    type: ["VerifiableCredential", "EndorsementCredential"],
    issuer: {
      id: "https://state.gov/issuers/565049",
      type: ["Profile"],
      name: "State Department of Education",
    },
    validFrom: "2010-01-01T00:00:00Z",
    validUntil: "2030-01-01T00:00:00Z",
    name: "Example endorsement",
    credentialSubject: {
      id: "https://example.edu/issuers/565049",
      type: ["EndorsementSubject"],
      endorsementComment: "Example University is in good standing",
    },
    credentialSchema: [
      {
        id: "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_endorsementcredential_schema.json",
        type: "1EdTechJsonSchemaValidator2019",
      },
    ],
  });

  expect(parsed.success).toBe(true);
});

test("GetOpenBadgeCredentialsResponseSchema parses credential and JWS collections", () => {
  const parsed = OpenBadgesV3_0.GetOpenBadgeCredentialsResponseSchema.safeParse({
    credential: {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      ],
      id: "https://example.test/credentials/1",
      type: ["VerifiableCredential", "OpenBadgeCredential"],
      issuer: "https://example.test/issuers/1",
      validFrom: "2025-01-01T00:00:00Z",
      credentialSubject: {
        type: ["AchievementSubject"],
        achievement: {
          id: "https://example.test/achievements/1",
          type: ["Achievement"],
          name: "Example Achievement",
          description: "Awarded for completing the example pathway.",
          criteria: { narrative: "Complete every required task." },
        },
      },
    },
    compactJwsString: "header.payload.signature",
  });

  expect(parsed.success).toBe(true);
});

test("AchievementCredentialSchema rejects missing OB context", () => {
  const parsed = OpenBadgesV3_0.AchievementCredentialSchema.safeParse({
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: "https://example.test/credentials/1",
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: "https://example.test/issuers/1",
    validFrom: "2025-01-01T00:00:00Z",
    credentialSubject: {
      type: ["AchievementSubject"],
      achievement: {
        id: "https://example.test/achievements/1",
        type: ["Achievement"],
        name: "Example Achievement",
        description: "Awarded for completing the example pathway.",
        criteria: { narrative: "Complete every required task." },
      },
    },
  });

  expect(parsed.success).toBe(false);
});

test("OpenBadges30DerivedZodTemplates exposes expected entry points", () => {
  expect(OpenBadgesV3_0.OpenBadges30DerivedZodTemplates.achievementCredential).toBe(
    OpenBadgesV3_0.AchievementCredentialSchema,
  );
  expect(OpenBadgesV3_0.OpenBadges30DerivedZodTemplates.openBadgeCredential).toBe(
    OpenBadgesV3_0.OpenBadgeCredentialSchema,
  );
  expect(OpenBadgesV3_0.OpenBadges30DerivedZodTemplates.imsxStatusInfo).toBe(OpenBadgesV3_0.ImsxStatusInfoSchema);
});
