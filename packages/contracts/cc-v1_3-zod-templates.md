# Common Cartridge XSD bundle (including embedded QTI profiles) → Zod template notes

## Published specification

- Overview: `https://www.imsglobal.org/cc/ccv1p3/imscc_Overview-v1p3.html`

This note accompanies the split source under `packages/contracts/src/common-cartridge/v1_3/` and the version barrel `packages/contracts/src/common-cartridge/v1_3/index.ts`.

The TypeScript templates are now split primarily by source XSD file. This document explains the design decisions, the tradeoffs behind them, and the places where the XSDs are not sufficient on their own because the real constraints live in embedded Schematron rules or in profile prose.

---

## 1. What was analyzed

The templates are based on these local XSD files under `tmp/cc`:

- `ccv1p3_imscp_v1p2_v1p0.xsd`
- `ccv1p3_imscsmd_v1p0.xsd`
- `ccv1p3_imsdt_v1p3.xsd`
- `ccv1p3_imswl_v1p3.xsd`
- `ccv1p3_lomccltilink_v1p0.xsd`
- `ccv1p3_lommanifest_v1p0.xsd`
- `ccv1p3_lomresource_v1p0.xsd`
- `ccv1p3_qtiasiv1p2p1_v1p0.xsd`
- `ccv1p3_imsccauth_v1p3.xsd`

This directory is best understood as a **Common Cartridge schema bundle**, not a separate QTI directory. One of the files (`ccv1p3_qtiasiv1p2p1_v1p0.xsd`) is the embedded Common Cartridge profile of QTI 1.2.1, but it belongs to this Common Cartridge family of schemas.

The Common Cartridge manifest XSD imports the authorization schema `ccv1p3_imsccauth_v1p3.xsd`, which is now modeled directly. That lets the templates represent both the optional manifest-level `authorizations` element and the imported resource-level `protected` boolean attribute.

Implementation layout:

- one TypeScript module per source XSD under `src/common-cartridge/v1_3/`
- a small number of internal support modules for shared helpers and LOM profile generation
- a version barrel at `src/common-cartridge/v1_3/index.ts`

---

## 2. The biggest design decision: raw XML fidelity vs useful TypeScript shapes

### Problem

XSD is fundamentally an XML grammar. Zod validates JavaScript values. There is no single “correct” way to project XML/XSD into JS objects.

Some examples from these schemas:

- XML attributes like `xml:lang`, `xml:base`, `linkrefid`, `feedbacktype`
- simple-content elements that carry both text and attributes
- embedded QTI-profile nodes whose meaning depends on **ordered heterogeneous children**
- LOM nodes whose XSD uses repeated unordered `xs:choice`, with the real cardinality enforced in embedded Schematron

If the goal were exact round-tripping, the right model would look like a generic XML tree.
If the goal were practical validation in TypeScript, the right model is a normalized object model.

### Decision

The templates deliberately target a **normalized parsed-XML representation**:

- element text is represented as `value`
- attributes are flattened to JS properties
- imported namespace prefixes are normalized away when context already disambiguates them
- embedded QTI-profile ordered children are preserved with `children: Node[]` unions where necessary
- LOM is normalized into plain object properties and arrays instead of preserving arbitrary sibling order

### Rationale

This choice makes the schemas usable.

A perfectly XML-faithful model would technically be more complete, but it would also be so generic that the resulting Zod templates would say very little about the real domain structure. The current templates are intentionally opinionated in favor of developer usability.

---

## 3. Why the templates use “raw” and “profile” layers

A recurring pattern across these XSDs is that the literal XSD body is **not the whole story**.

Two important examples:

1. **Common Cartridge manifest**
   - the XSD defines the structural grammar
   - the embedded Schematron defines many real business rules
     - duplicate dependency/file detection
     - forbidden dependency graphs between resource types
     - `href`/`file` coupling
     - item-to-question-bank restrictions

2. **Embedded QTI ASI profile inside Common Cartridge**
   - the XSD allows broad structural patterns
   - the embedded Schematron narrows them into actual question profile rules
     - T/F, multiple choice, multiple response, FIB, pattern match, essay
     - metadata field vocabularies and multiplicities
     - feedback linkage rules

### Decision

The TypeScript file exports both:

- **raw structural schemas** that match the XSD-declared object shape
- **profile schemas** with `.superRefine()` rules to encode the most important Schematron-level constraints

### Rationale

This makes the output reusable in two modes:

- validate “is this shaped like the XML grammar?”
- validate “does this satisfy the actual profile semantics the XSD expects?”

That split is especially important because the profile prose, the XSD, and the active embedded Schematron do not always agree perfectly.

---

## 4. File-by-file analysis and mapping decisions

## 4.1 `ccv1p3_imscsmd_v1p0.xsd`

This is the simplest schema in the set.

### Structural summary

Root element:

- `curriculumStandardsMetadataSet`

Important types:

- `CurriculumStandardsMetadataSet.Type`
- `CurriculumStandardsMetadata.Type`
- `SetOfGUIDs.Type`
- `LabelledGUID.Type`

### Mapping decision

This XSD maps very directly to plain objects, so the template stays close to the XSD names.

### Rationale

There are no difficult ordering or namespace tradeoffs here, so a straightforward direct Zod object model is the most transparent choice.

---

## 4.2 `ccv1p3_imsdt_v1p3.xsd`

Discussion Topic is also structurally straightforward.

### Structural summary

Root element:

- `topic`

Important types:

- `Topic.Type`
- `Text.Type`
- `Attachments.Type`
- `Attachment.Type`

### Mapping decision

- `text` becomes an object with `value` and `texttype`
- `attachment` becomes an object with `href`
- the `grpStrict.any` extension point becomes `extensions?: XmlExtensionNode[]`

### Rationale

This keeps the schema readable while still preserving the important information from the XSD:

- text value
- MIME-style text type
- extension slot

---

## 4.3 `ccv1p3_imswl_v1p3.xsd`

Web Link is similar to Discussion Topic.

### Structural summary

Root element:

- `webLink`

Important types:

- `WebLink.Type`
- `URL.Type`

### Mapping decision

- `url` is modeled as a nested object with `href`, `target`, and `windowFeatures`
- extension points again become `extensions?: XmlExtensionNode[]`

### Rationale

This is the cleanest normalized JS shape while still remaining very easy to map back to the source XSD.

---

## 4.4 `ccv1p3_lommanifest_v1p0.xsd` and `ccv1p3_lomresource_v1p0.xsd`

These two schemas are effectively the same structurally.

### Structural summary

Both expose:

- root element `lom`
- the same large set of LOM complex types
- loose value typing for vocab-like `value` elements
- `grpLax.any` extension points and foreign attributes on many types

### Important XSD characteristic

These schemas use repeated unordered `xs:choice` content models. The **real singleton limits** are enforced by the embedded Schematron rules.

Example:

- `general.title` is intended to be 0..1
- `rights.cost` is intended to be 0..1
- `relation.kind` is intended to be 0..1

but the raw XSD shape on its own is looser than that.

### Mapping decision

The templates use:

- plain object properties for singleton-ish children
- arrays for repeatable children
- optional `extensions` / `foreignAttributes` on loose profiles
- a small Schematron-inspired refinement on the root LOM object to document the singleton expectation

### Rationale

Trying to preserve the unordered repeated `xs:choice` literally in JS would produce an awkward structure that is much less usable than a normalized object model. This is a case where Zod is better used to validate the **intended object model** rather than to mirror the low-level serialization trick the XSD uses.

---

## 4.5 `ccv1p3_lomccltilink_v1p0.xsd`

This is the strictest of the LOM family.

### Structural summary

It shares the same high-level LOM section graph as the other LOM profiles, but it differs in two important ways:

1. it does **not** allow the loose extension model
2. many `value` elements are restricted to explicit enumerations

### Mapping decision

The TypeScript file reuses the same LOM section structure but swaps in strict value enums for the LTI profile.

### Rationale

This is a good place to share structure and vary only the profile policy:

- loose manifest/resource profiles: `value: z.string()`
- strict LTI profile: `value: z.enum([...])`

That keeps the templates internally consistent and makes the profile difference explicit.

---

## 4.6 `ccv1p3_imscp_v1p2_v1p0.xsd`

This is the Common Cartridge manifest profile.

### Structural summary

Root element:

- `manifest`

Key containers:

- `metadata`
- `organizations`
- `resources`
- optional imported `authorizations`

Key nested types:

- `Manifest.Type`
- `ManifestMetadata.Type`
- `Organization.Type`
- `ItemOrg.Type`
- `Item.Type`
- `Resource.Type`
- `ResourceMetadata.Type`
- `File.Type`
- `Dependency.Type`
- imported `Authorizations.Type`
- imported `Authorization.Type`

### Important tradeoff

The XSD itself is not enough. The embedded Schematron contributes a large amount of real semantic validation.

Examples encoded into the profile schema:

- duplicate `file/@href` inside a resource is forbidden
- duplicate `dependency/@identifierref` inside a resource is forbidden
- circular dependency on self is forbidden
- certain resource types must not use `href`
- `resource/@href` requires at least one matching `file/@href`
- web links must not have any dependency elements
- question-bank resources must not be referenced by manifest items
- manifest items with `identifierref` must not have child items

### Important modeling decision

The imported authorization schema is now modeled directly.

That adds explicit support for:

- manifest-level `authorizations`
- the nested `authorization` object with required `cartridgeId` and optional `webservice`
- required `access` values of `cartridge | resource`
- optional boolean `import` on the `authorizations` wrapper
- the imported resource-level `protected` boolean attribute
- the strict foreign-extension slot allowed by the auth XSD on `authorizations`

### Rationale

Now that the dependency is present locally, a direct schema mapping is more accurate than a placeholder. The templates still stop at **metadata structure validation**; they do not attempt to implement any authorization runtime or content-protection workflow.

---

## 4.7 `ccv1p3_qtiasiv1p2p1_v1p0.xsd`

This is the embedded Common Cartridge profile of QTI 1.2.1, and it is the most complex schema in the set.

### Structural summary

Root element:

- `questestinterop`

The root contains exactly one of:

- `assessment`
- `objectbank`

Key subtrees:

- item presentation
- response processing
- metadata fields
- feedback / hint / solution blocks
- recursive boolean condition nodes
- recursive flow / material / label nodes

### Biggest tradeoff in the whole set

QTI uses a lot of **ordered heterogeneous content**.

Examples:

- `flow`
- `flow_mat`
- `flow_label`
- `material`
- `render_choice`
- `render_fib`
- `itemfeedback`

If those are flattened into “just arrays of materials” or “just arrays of responses”, too much meaning is lost.

### Mapping decision

The templates model these QTI sections as small AST-like unions with explicit `kind` fields and ordered `children` arrays.

Examples:

- `material` → ordered array of `mattext | matref | matbreak`
- `flow` → ordered array of `flow | material | material_ref | response_lid | response_str`
- `itemfeedback` → ordered array of `flow_mat | material | solution | hint`

### Rationale

This is the smallest normalized JS representation that still preserves the aspects of order that matter for QTI logic and rendering.

---

## 5. Why `kind` discriminators were added for QTI nodes

The XSD obviously does not contain a `kind` attribute on most nodes.

### Decision

The templates add a synthetic `kind` literal field on many QTI node types.

Examples:

- `kind: "material"`
- `kind: "flow"`
- `kind: "response_label"`
- `kind: "hint"`
- `kind: "solution"`

### Rationale

This is one of the places where a TypeScript/Zod model is different from the source XML model on purpose.

Without a discriminator, recursive Zod unions become much harder to understand and to use downstream. Adding `kind` is a pragmatic normalization step that makes the schemas substantially more usable while still remaining structurally faithful.

---

## 6. Important places where the templates intentionally follow the XSD + active Schematron over prose

There are several mismatches between comments/prose and the literal schema bodies.

### Common Cartridge manifest examples

- the prose says `dependency/@identifierref` was changed to `xs:IDREF`, but the XSD body still declares `xs:string`
- the prose discusses external VDEX handling for resource types, but the XSD body still has a local inline enumeration
- the prose implies tighter constraints in some places than the active Schematron actually enforces

### QTI examples

- the profile prose strongly suggests some metadata containers are mandatory
- the raw XSD leaves them optional
- the active Schematron generally validates them **if present**, rather than forcing them to exist everywhere

### Decision

The templates favor:

1. literal XSD structure
2. active embedded Schematron
3. prose comments only when they do not conflict with 1 or 2

### Rationale

That order of trust is the safest way to avoid silently baking in rules that are described in comments but not actually present in the effective shipped schema binding.

---

## 7. What is still intentionally approximate

These templates are substantial, but they are still templates.

### 7.1 LOM leaf-level foreign attributes

The loose LOM profiles technically allow foreign attributes on many leaf nodes. The template does not attempt to preserve that with perfect fidelity everywhere.

### 7.2 Authorization workflow semantics

The authorization schema is now modeled structurally, but the templates still do **not** implement or validate any end-to-end authorization exchange or authenticated content access flow. They validate the schema shape only.

### 7.3 Full XML lexical fidelity

The templates are not a byte-level XML round-trip model.

For example:

- namespace prefixes are not preserved as first-class data
- attribute order is not preserved
- the exact XSD mechanism for unordered repeated `choice` groups is normalized away in LOM

### Rationale

All three omissions are deliberate. Modeling them exactly would make the templates much harder to use while adding comparatively little value for the likely TypeScript/Zod use case.

---

## 8. How to interpret the output structure

The main source layout is:

- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_imscp_v1p2_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_imscsmd_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_imsdt_v1p3.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_imswl_v1p3.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_lommanifest_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_lomresource_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_lomccltilink_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_imsccauth_v1p3.ts`
- `packages/contracts/src/common-cartridge/v1_3/ccv1p3_qtiasiv1p2p1_v1p0.ts`
- `packages/contracts/src/common-cartridge/v1_3/index.ts`

The version barrel `packages/contracts/src/common-cartridge/v1_3/index.ts` re-exports the directory surface for this specific Common Cartridge version.

The most important exports are:

### Simpler direct mappings

- `CurriculumStandardsMetadataSetDocumentSchema`
- `DiscussionTopicDocumentSchema`
- `WebLinkDocumentSchema`

### LOM profiles

- `LomManifestDocumentSchema`
- `LomResourceDocumentSchema`
- `LomCcLtiLinkDocumentSchema`

### Common Cartridge manifest

- `CommonCartridgeAuthorizationsDocumentSchema`
- `CommonCartridgeManifestRawDocumentSchema`
- `CommonCartridgeManifestProfileDocumentSchema`

### Embedded QTI ASI profile

- `QtiQuestestinteropRawDocumentSchema`
- `QtiQuestestinteropProfileDocumentSchema`

### Convenience bundle

- `CommonCartridgeDerivedZodTemplates`

The raw/profile split is important:

- **raw** = XSD structure
- **profile** = XSD structure plus important Schematron-derived semantic checks

---

## 9. If this were taken further

The next logical refinements would be:

1. add parser adapters for a specific XML parser output shape
2. add parser-specific coercion or normalization for XML booleans/defaults such as `import` and `protected` if a concrete parser is chosen
3. add more complete LOM Schematron refinements if strict profile-level validation becomes a requirement
4. tighten the recursive schema typing so fewer helper-boundary casts are needed

The source is now split by schema file under `packages/contracts/src/common-cartridge/v1_3/`, with a version barrel preserved at `packages/contracts/src/common-cartridge/v1_3/index.ts`.
