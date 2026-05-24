# CAT v1.0 implementation -> Zod template notes

## Published specification

- Main specification: `https://www.imsglobal.org/spec/cat/v1p0/impl/`
- Latest specification permalink: `https://www.imsglobal.org/spec/cat/latest/impl/`
- Errata: `https://www.imsglobal.org/spec/cat/v1p0/errata/`

This note accompanies `packages/contracts/src/cat/v1_0/`.

---

## 1. What was implemented

This port models the CAT v1.0 core REST service contract and shared payload types:

- section configuration (`SectionData`)
- item staging (`ItemStage`)
- candidate submission payloads (`AssessmentResult`)
- CAT engine return payloads (`CatEngineResultReport`)
- operation request/response envelopes for:
  - `createSection`
  - `getSection`
  - `createSession`
  - `submitResults`
  - `endSession`
  - `endSection`

Public package surface:

- root namespace: `CatV1_0`
- subpath export: `@conform-ed/contracts/cat/v1_0`

---

## 2. Structural choices

The implementation is split into:

- `shared.ts` for core CAT data types, shared primitives, and request/response schemas
- `cat_v1p0_restbinding_operations_schema.ts` for endpoint-level operation contracts
- `index.ts` for namespaced exports and derived template metadata

---

## 3. Validation choices

- strict objects are used across payloads (`.strict()`) to avoid silent property drift
- UUID fields use RFC4122 regex validation
- date-time fields allow both `Z` and numeric UTC offset forms
- enumerated values use explicit vocabularies where practical, with optional `ext:*` extension tokens for extensibility
- error payloads are normalized into a predictable `{ error, message, statusCode, details? }` shape

---

## 4. REST binding operation shape

Each operation entry exposes:

- `method`
- `path`
- `requestPayload`
- `successResponsePayload`
- `errorResponsePayload`

This mirrors the operation-catalog pattern used in other contracts packages (e.g., OneRoster REST bindings) and keeps API-client generation/introspection straightforward.

---

## 5. Known limitations

- CAT engine-specific custom payload fragments are intentionally open (`z.record(z.string(), z.unknown())`) where the published specification does not tightly standardize vendor-specific structures.
- This version focuses on the core CAT service API contracts and does not attempt to fully model every adjacent referenced standard artifact (QTI Metadata, Usage Data vocabularies, etc.) inline.
