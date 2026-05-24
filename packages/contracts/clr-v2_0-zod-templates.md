# Comprehensive Learner Record 2.0 JSON schema bundle -> Zod template notes

## Published specification

- Main specification: `https://www.imsglobal.org/spec/clr/v2p0/`
- Main spec document: `https://www.imsglobal.org/spec/clr/v2p0/main/`
- JSON-LD context: `https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json`
- Published JSON schemas used for this port:
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_clrcredential_schema.json`
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_achievementcredential_schema.json`
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_endorsementcredential_schema.json`
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_getclrcredentialsresponse_schema.json`
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_profile_schema.json`
  - `https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_imsx_statusinfo_schema.json`

This note accompanies the versioned source under `packages/contracts/src/clr/v2_0/`.

---

## 1. What was implemented

CLR 2.0 is not an XSD family like the QTI and Common Cartridge ports. The published source of truth here is the JSON Schema and JSON-LD credential model bundle.

The port therefore models the published JSON-schema entry points rather than inventing XML-style document wrappers:

- `ClrCredentialSchema`
- `AchievementCredentialSchema`
- `EndorsementCredentialSchema`
- `GetClrCredentialsResponseSchema`
- `ProfileSchema`
- `ImsxStatusInfoSchema`

The version barrel exports these as `ClrV2_0`, and `Clr20DerivedZodTemplates` collects the published entry points in one place.

---

## 2. Main structural choice: extract shared VC/credential primitives

CLR 2.0 clearly overlaps with the same broader digital-credential model family used by Open Badges 3.0:

- `AchievementCredential`
- `EndorsementCredential`
- `Profile`
- `Achievement`
- `Result`
- `Proof`
- and the surrounding verifiable-credential primitives

The implementation now uses a shared versioned layer for common primitives:

- `src/vc-data-model/v2_0/` for VC-level/shared primitives
- `src/open-badges/v3_0/shared.ts` for the shared OB/CLR credential model graph

CLR composes from that shared model and keeps only CLR-specific wrappers in `src/clr/v2_0/`.

### Rationale

- it removes duplicated credential-model logic between CLR and Open Badges
- it keeps VC/credential semantics aligned across both standards
- it still preserves versioned, explicit standard surfaces at the package boundary

---

## 3. Main validation choice: prefer normative credential arrays over the JSON-LD compaction fallback

The published JSON Schema files are adapted for JSON-LD compaction, so several properties are more permissive than the underlying normative intent:

- credential `@context`
- credential `type`
- several single-or-array properties

For the Zod port, the repeated-value properties still accept either a single value or an array where that is useful for real payloads, but the key credential identity fields are intentionally made more semantic:

- `ClrCredential` requires a credential `type` array containing `VerifiableCredential` and `ClrCredential`
- `AchievementCredential` requires `VerifiableCredential` and one of `AchievementCredential` / `OpenBadgeCredential`
- `EndorsementCredential` requires `VerifiableCredential` and `EndorsementCredential`
- credential `@context` arrays are validated against the expected CLR / OB / VC ordering rather than accepting any arbitrary single context value

### Rationale

The published JSON Schema bundle under-enforces some of those rules in order to support JSON-LD compaction patterns. For this repo, the more useful default is to validate the portable, explicit credential shapes that implementers are most likely to exchange.

---

## 4. Extensibility choice: preserve open object surfaces where the spec does

Most CLR credential-model objects are extensible in the published JSON Schema bundle.

The Zod port mirrors that with passthrough object schemas for the credential-model objects, while the stricter API-envelope schemas remain strict:

- passthrough for credential/profile/achievement-style objects
- strict for `GetClrCredentialsResponse`
- strict for `ImsxStatusInfo`

### Rationale

This keeps the CLR credential objects usable for real JSON-LD / extension-heavy payloads without silently tightening the spec into a closed-world model.

---

## 5. Public surface and naming

The contracts package now exposes CLR 2.0 in the same style as the other standards:

- package-root namespace: `ClrV2_0`
- package subpath: `@conform-ed/contracts/clr/v2_0`

The source modules mirror the published schema artifact names where that remains useful:

- `clr_v2p0_clrcredential_schema.ts`
- `clr_v2p0_achievementcredential_schema.ts`
- `clr_v2p0_endorsementcredential_schema.ts`
- `clr_v2p0_profile_schema.ts`
- `clr_v2p0_getclrcredentialsresponse_schema.ts`
- `clr_v2p0_imsx_statusinfo_schema.ts`

with `shared.ts` holding the common credential-model pieces used across those entry points.
