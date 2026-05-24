# Common Cartridge 1.4 candidate-final XSD bundle → Zod template notes

## Published specification

- Public implementation guide consulted for this port: `https://www.imsglobal.org/spec/cc/v1p4/impl/`
- Likely published-final landing page: `https://www.imsglobal.org/spec/cc/v1p4`

This note accompanies the split source under `packages/contracts/src/common-cartridge/v1_4/`.

The Common Cartridge 1.4 candidate-final bundle is materially broader than the existing 1.3 bundle: it includes multiple manifest profiles, additional shared resource schemas, imported LTI support schemas, extension schemas, and VDEX support files. This document records the choices made to keep the 1.4 port close to the existing `v1_3` style while still matching the shape of the real source set.

---

## 1. What was analyzed

The templates are based on the local source bundle under `tmp/cc/v1_4/`:

- `core/`
- `thin/`
- `k12/`
- `shared/`
- `extension/`
- `vdex/`

Representative entry-point XSDs:

- `core/ccv1p4_imscp_v1p2_v1p0.xsd`
- `thin/ccv1p4_imscp_v1p2_v1p0.xsd`
- `k12/ccv1p4_imscp_v1p2_v1p0.xsd`
- `k12/ccv1p4_imscp_v1p2_v1p0.xsd.thin`
- `shared/ccv1p4_imslticc_v1p4.xsd`
- `extension/cc_extresource_assignmentv1p0_v1p0.xsd`
- `extension/ims_openvideov1p0_v1p0.xsd`
- `vdex/imsvdex_v1p0.xsd`

The candidate final implementation guide at `https://www.imsglobal.org/spec/cc/v1p4/impl` was also consulted to confirm the intended profile split and the relationship between the standard, Thin CC, and K-12 variants.

---

## 2. The main structural decision: mirror the source bundle layout

### Problem

Common Cartridge 1.3 fit comfortably in one flat implementation directory because the source bundle itself was flat. Common Cartridge 1.4 does not:

- `core`, `thin`, and `k12` reuse several of the same filenames
- the K-12 directory contains both a standard manifest XSD and a separate `.xsd.thin` variant
- the shared/extension/vdex areas introduce several new families that are not just minor renames of 1.3 files

Flattening all of that into a single directory would require invented file renames for source collisions.

### Decision

The port mirrors the source bundle under `src/common-cartridge/v1_4/`:

- `core/`
- `thin/`
- `k12/`
- `shared/`
- `extension/`
- `vdex/`

Shared helper modules remain at the version root:

- `shared.ts`
- `lom-internal.ts`
- `index.ts`

### Rationale

This preserves the strongest existing convention — one TypeScript module per source XSD — while making the 1.4 profile split obvious instead of hiding it behind ad hoc file renames.

---

## 3. The package-surface decision: versioned namespaces at the root

### Problem

Once a second Common Cartridge version is exported from the package root, flat re-exports collide immediately:

- `CommonCartridgeManifestProfileDocumentSchema`
- `LomManifestDocumentSchema`
- `CurriculumStandardsMetadataSetSchema`
- and many more

### Decision

The package root now exports versioned namespaces for Common Cartridge:

- `CommonCartridgeV1_3`
- `CommonCartridgeV1_4`

The version barrel at `src/common-cartridge/v1_4/index.ts` still exports a flat surface **within the version**, because that remains convenient and collision-free inside a versioned namespace.

### Rationale

This is the least disruptive way to support side-by-side versions without renaming every existing schema export in `v1_3`.

---

## 4. Profile handling decisions

## 4.1 Core manifest profile

The core manifest module stays very close to the 1.3 implementation:

- updated resource type enumeration for 1.4
- updated manifest schema labels and `schemaversion`
- updated QTI resource type strings from `imscc_xmlv1p3` to `imscc_xmlv1p4`
- existing Schematron-derived duplicate/dependency/item checks carried forward

The main 1.4 additions in the resource type vocabulary are:

- `imsov_xmlv1p0`
- `imsov_zipv1p0`
- `imsqti_zipv3p0`

## 4.2 Thin manifest profile

The Thin CC manifest genuinely differs structurally, so it has its own dedicated module rather than just a renamed alias:

- only `imsbasiclti_xmlv1p4` and `imswl_xmlv1p4` resource types are allowed
- dependency support is removed
- manifest-level authorizations are removed
- the resource body can carry embedded `cartridge_basiclti_link` or `webLink` XML

The Zod model therefore makes those embedded resource payloads explicit and validates that the inline XML matches the declared resource `type`.

## 4.3 K-12 manifest profiles

The provided K-12 packaging XSDs are the tricky part.

The local `k12/ccv1p4_imscp_v1p2_v1p0.xsd` is effectively the same packaging grammar as the core manifest, and `k12/ccv1p4_imscp_v1p2_v1p0.xsd.thin` is effectively the Thin CC grammar. The stricter K-12 rules in the local bundle live primarily in the standalone K-12 LOM profile XSDs, not in a materially different manifest grammar.

### Decision

The port treats the K-12 manifest modules as profile-specific aliases of the core and thin manifest schemas:

- `K12CommonCartridge...` aliases the core manifest surface
- `K12ThinCommonCartridge...` aliases the thin manifest surface

The standalone K-12 LOM schemas carry the extra K-12 metadata requirements.

### Rationale

This follows the actual local source set instead of inventing packaging constraints that are not expressed in the shipped `imscp` XSDs.

This is one of the places where a different choice would have been possible: we could have added extra K-12 manifest-level refinements based on prose expectations alone. The implementation deliberately did **not** do that because the local packaging XSDs do not wire those stricter LOM profiles into the manifest imports.

---

## 5. LOM profile decisions

The shared `lom-internal.ts` still generates normalized LOM object schemas, but 1.4 adds more than one practical LOM profile:

- core manifest/resource
- Thin CC manifest/resource
- K-12 manifest/resource
- CC LTI link metadata

### Decision

- core and thin manifest/resource LOM profiles remain loose-value profiles
- K-12 manifest LOM adds required `general.keyword`
- K-12 resource LOM adds required:
  - `general`
  - `general.title`
  - `general.keyword`
  - at least one `educational`
  - `educational.intendedEndUserRole`
  - `educational.typicalAgeRange`
- LTI link metadata keeps the tighter vocabulary-checked profile carried forward from 1.3

### Rationale

This keeps the general LOM modeling approach unchanged while giving the K-12 standalone metadata documents the stricter rules that actually differ in the 1.4 bundle.

---

## 6. Shared/additional schema decisions

## 6.1 `ccv1p4_imscsmd_v1p1.xsd`

This is the 1.3 curriculum-standards model with one meaningful additive change:

- `LabelledGUID.Type` adds optional `caseItemURI`

That was modeled directly.

## 6.2 LTI support schemas

Common Cartridge 1.4 bundles more of the LTI support stack locally:

- `imslticm_v1p0`
- `imslticp_v1p0`
- `imsbasiclti_v1p0p1`
- `ccv1p4_imslticc_v1p4`

These are modeled as normalized nested objects rather than generic XML trees so that Thin CC embedded resources and standalone LTI descriptors are usable directly.

## 6.3 Assignment, line item, and accessibility metadata

These three families map cleanly to plain objects:

- assignment extension
- AGS line item
- accessibility metadata

They are represented directly with only the obvious scalar/enum normalization.

## 6.4 VDEX support files

The 1.4 bundle includes:

- `imsmd_loose_v1p3p2.xsd`
- `imsvdex_v1p0.xsd`

`imsmd_loose` is modeled as a standalone loose LOM document. `imsvdex` is modeled as a normalized vocabulary tree with recursive `term` nodes and a small refinement to detect duplicate `termIdentifier` values.

## 6.5 Open Video

Open Video is the largest new schema family in the bundle.

### Decision

It is modeled as an explicit normalized object graph rather than collapsed to generic XML, but the semantic refinements stay intentionally focused:

- duplicate contributor IDs
- duplicate recorder IDs
- `stream.recorderID` must reference an existing recorder

### Rationale

This keeps the schema useful while avoiding a large amount of fragile hand-coded prose validation that would go beyond the level of rigor used elsewhere in the package.

---

## 7. Remaining approximations

The 1.4 port still makes a few deliberate approximations:

1. K-12 manifest modules alias the core/thin packaging grammars instead of inventing additional manifest-level metadata rules.
2. Open Video does not attempt to encode every prose-level invariant from the candidate final text.
3. Thin/resource embedded XML is normalized to explicit `cartridge_basiclti_link` / `webLink` object slots instead of preserving heterogeneous XML child order.
4. Remote include files such as the shared extension helper XSDs are still represented through the existing `XmlExtensionNode` / foreign-attribute pattern rather than being ported as literal helper ASTs.

These are intentional consistency choices, not omissions.
