# OneRoster 1.2 JSON schema/OpenAPI bundle -> Zod template notes

## Published specification

- Main specification: `https://www.imsglobal.org/spec/oneroster/v1p2/`
- Rostering service information model: `https://www.imsglobal.org/spec/oneroster/v1p2/rostering/info`
- Rostering service REST binding: `https://www.imsglobal.org/spec/oneroster/v1p2/rostering/bind/rest`
- Rostering REST binding permalink: `https://www.imsglobal.org/spec/oneroster/v1p2/rostering-restbinding/`
- Gradebook service information model: `https://www.imsglobal.org/spec/oneroster/v1p2/gradebook/info`
- Gradebook service REST binding: `https://www.imsglobal.org/spec/oneroster/v1p2/gradebook/bind/rest`
- Gradebook REST binding permalink: `https://www.imsglobal.org/spec/oneroster/v1p2/gradebook-restbinding/`
- Resource service information model: `https://www.imsglobal.org/spec/oneroster/v1p2/resource/info`
- Resource service REST binding: `https://www.imsglobal.org/spec/oneroster/v1p2/resource/bind/rest`
- Resource REST binding permalink: `https://www.imsglobal.org/spec/oneroster/v1p2/resources-restbinding/`
- CSV binding: `https://www.imsglobal.org/spec/oneroster/v1p2/bind/csv/`
- OpenAPI 3 JSON sources used directly:
  - `https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2rostersservice_openapi3_v1p0.json`
  - `https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2gradebookservice_openapi3_v1p0.json`
  - `https://purl.imsglobal.org/spec/or/v1p2/schema/openapi/onerosterv1p2resourcesservice_openapi3_v1p0.json`

This note accompanies `packages/contracts/src/oneroster/v1_2/`.

---

## 1. What was implemented

This port models:

- rostering
- gradebook
- resource
- endpoint-specific REST binding operation payload contracts for all published operations
- CSV binding row/document/package contracts for the published CSV files

The public package surface is:

- root namespace: `OneRosterV1_2`
- subpath export: `@conform-ed/contracts/oneroster/v1_2`

The version barrel publishes the service schemas and `OneRoster12DerivedZodTemplates`.

---

## 2. Structural choices

The implementation is split into:

- `shared.ts` for common primitives (`metadata`, status vocabularies, GUID refs, IMSX status envelope)
- `or_v1p2_rostering_service_schema.ts`
- `or_v1p2_gradebook_service_schema.ts`
- `or_v1p2_resource_service_schema.ts`
- `or_v1p2_rostering_restbinding_schema.ts`
- `or_v1p2_gradebook_restbinding_schema.ts`
- `or_v1p2_resource_restbinding_schema.ts`
- `or_v1p2_csv_binding_schema.ts`

This mirrors the OneRoster 1.2 service split and avoids duplicating shared shapes across services.

---

## 3. Validation choices

- objects marked `additionalProperties: false` in the published OpenAPI schemas are modeled as strict Zod objects
- `MetadataDType` and `CredentialDType` stay open where the source model is open
- extensible vocabularies are modeled as:
  - defined enum values
  - plus `ext:*` custom values where the specification allows extension tokens
- date/date-time and URI fields use explicit ISO/URL validators

---

## 4. CSV binding modeling choice

The CSV layer is modeled as raw row/document schemas (string cell values) keyed by published column headers, plus a package-level aggregate schema.

For manifest keys that appear in the spec with trailing `*` markers, the schema accepts both starred and unstarred variants and requires at least one to be present.
