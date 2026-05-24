# Open Badges 3.0 JSON schema bundle -> Zod template notes

## Published specification

- Main specification: `https://www.imsglobal.org/spec/ob/v3p0/`
- Main spec document: `https://www.imsglobal.org/spec/ob/v3p0/main/`
- Implementation guide: `https://www.imsglobal.org/spec/ob/v3p0/impl/`
- JSON-LD context: `https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json`
- Published JSON schemas used for this port:
  - `https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json`
  - `https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_endorsementcredential_schema.json`
  - `https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_getopenbadgecredentialsresponse_schema.json`
  - `https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_profile_schema.json`
  - `https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_imsx_statusinfo_schema.json`

This note accompanies `packages/contracts/src/open-badges/v3_0/`.

---

## 1. What was implemented

The Open Badges 3.0 port models the published JSON-schema entry points directly:

- `AchievementCredentialSchema` (`OpenBadgeCredentialSchema` alias)
- `EndorsementCredentialSchema`
- `GetOpenBadgeCredentialsResponseSchema`
- `ProfileSchema`
- `ImsxStatusInfoSchema`

The version barrel exports these as `OpenBadgesV3_0`, and `OpenBadges30DerivedZodTemplates` groups the top-level published entries.

---

## 2. Shared-model choice

Open Badges 3.0 and CLR 2.0 reuse almost the same credential model graph (Achievement, Profile, EndorsementCredential, Result, Proof, and related primitives). Rather than duplicating those pieces again, this port centralizes the cross-standard primitives in:

- `src/vc-data-model/v2_0/` for VC-level/shared credential primitives
- `src/open-badges/v3_0/shared.ts` for OB-specific profile/achievement structures

CLR now composes from this same OB/VC model layer.

---

## 3. Validation strictness choice

Like CLR, the OB 3.0 schemas are JSON-LD-compaction-friendly and permissive in places. The Zod port keeps extension-friendly object surfaces, but tightens core credential identity semantics:

- `AchievementCredential` requires `VerifiableCredential` plus one of `AchievementCredential` / `OpenBadgeCredential`
- `EndorsementCredential` requires `VerifiableCredential` plus `EndorsementCredential`
- `@context` ordering enforces expected OB 3.0 context prefixes while still allowing additional context entries

---

## 4. Public surface and naming

- package-root namespace: `OpenBadgesV3_0`
- package subpath: `@conform-ed/contracts/open-badges/v3_0`

Source modules mirror the published artifact names:

- `ob_v3p0_achievementcredential_schema.ts`
- `ob_v3p0_endorsementcredential_schema.ts`
- `ob_v3p0_getopenbadgecredentialsresponse_schema.ts`
- `ob_v3p0_profile_schema.ts`
- `ob_v3p0_imsx_statusinfo_schema.ts`
