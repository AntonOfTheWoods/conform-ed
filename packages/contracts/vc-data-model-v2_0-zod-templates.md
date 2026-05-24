# Verifiable Credentials Data Model 2.0 -> Zod template notes

## Published specification

- W3C Recommendation: `https://www.w3.org/TR/vc-data-model-2.0/`

This note accompanies `packages/contracts/src/vc-data-model/v2_0/`.

---

## 1. Scope choice

VC Data Model 2.0 does not ship as a single 1EdTech-style JSON schema bundle that maps one-to-one to this repository's versioned schema-port workflow.

To integrate it cleanly for Open Badges 3.0 and CLR 2.0, this package implements the shared VC and credential primitives used by both standards:

- `VerifiableCredentialSchema`
- `VerifiablePresentationSchema`
- `CredentialSubjectSchema`
- `CredentialSchemaSchema`
- `CredentialStatusSchema`
- `RefreshServiceSchema`
- `TermsOfUseSchema`
- `ProofSchema`
- `EvidenceSchema`
- `HolderSchema`

Grouped as `VcDataModel20DerivedZodTemplates`.

---

## 2. Relationship to Open Badges and CLR

This VC Data Model surface is intentionally shared infrastructure. Open Badges 3.0 and CLR 2.0 version bundles compose on top of it, with each standard adding its own context/type constraints and domain objects.

This avoids duplicated logic and keeps cross-standard behavior aligned.

---

## 3. Public surface and naming

- package-root namespace: `VcDataModelV2_0`
- package subpath: `@conform-ed/contracts/vc-data-model/v2_0`
