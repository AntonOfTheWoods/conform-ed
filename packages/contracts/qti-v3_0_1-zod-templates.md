# QTI 3.0.1 XSD bundle → Zod template notes

## Published specification

- Overview: `https://www.imsglobal.org/spec/qti/v3p0/oview/`
- QTI 3.0.1 ASI information model: `https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html`
- QTI 3.0.1 ASI XSD binding: `https://www.imsglobal.org/sites/default/files/spec/qti/v3/bind/imsqti_asi_v3p0p1_xsdbind_v1p0.html`
- QTI 3 Results Reporting: `https://www.imsglobal.org/sites/default/files/spec/qti/v3/rr-bind/index.html`
- QTI 3 Usage Data and Item Statistics: `https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html`

This note accompanies the split source under `packages/contracts/src/qti/v3_0_1/`.

The TypeScript templates are split primarily by source XSD file, with most of the real structural work concentrated in shared internal modules. This document records the design decisions behind the QTI 3.0.1 port, the places where the XSD maps cleanly to Zod, and the places where the project intentionally chose a normalized JavaScript model over literal XML fidelity.

## QTI Results Reporting assessment (v3)

QTI 3 Results Reporting and Usage Data are published as separate QTI companion spec documents, and are represented in this codebase through explicit QTI 3.0.1 result/usage entry points:

- `imsqti_resultv3p0_v1p0.ts` provides `QtiAssessmentResultDocumentSchema` and validated result-variable constraints
- `imsqti_usagedatav3p0_v1p0.ts` provides `QtiUsageDataDocumentSchema` aligned to the QTI 3 Usage Data XSD
- the v3 namespace exports this via `src/qti/v3_0_1/index.ts` and `Qti301DerivedZodTemplates.qtiAssessmentResultDocument`
- the v3 namespace also exports `Qti301DerivedZodTemplates.qtiUsageDataDocument`

Assessment outcome for v3:

1. Results Reporting and Usage Data are separate published spec artifacts, but fit naturally under the existing `qti/v3_0_1` package surface.
2. Core result-reporting and usage-data document support is implemented in the v3_0_1 contracts surface.
3. Enhancement-level strictness can continue iteratively (e.g., tighter vocabulary profiles), but no standalone greenfield package is required.

---

## 1. What was analyzed

The templates are based on these local XSD files under `tmp/qti/3.0.1`:

- `imsqti_asiv3p0p1_v1p0.xsd`
- `imsqti_itemv3p0p1_v1p0.xsd`
- `imsqti_metadatav3p0_v1p0.xsd`
- `imsqti_outcomev3p0p1_v1p0.xsd`
- `imsqti_responseprocessingv3p0p1_v1p0.xsd`
- `imsqti_resultv3p0_v1p0.xsd`
- `imsqti_sectionv3p0p1_v1p0.xsd`
- `imsqti_stimulusv3p0p1_v1p0.xsd`
- `imsqti_testv3p0p1_v1p0.xsd`
- `https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_usagedatav3p0_v1p0.xsd`
- `imsqtiv3p0_afa3p0pnp_v1p0.xsd`

The adjacent `tmp/qti/3.0.1/infos.md` was also used because it explains the intended validation entry points:

- the ASI schema is the umbrella validator
- the other XSDs are resource-specific entry points for standalone package resources

Implementation layout:

- one TypeScript facade module per source XSD under `src/qti/v3_0_1/`
- internal support modules for shared structures and semantic rules:
  - `assessment-internal.ts`
  - `variables-internal.ts`
  - `processing-internal.ts`
  - `shared.ts`
- a bundle barrel at `src/qti/v3_0_1/index.ts`

---

## 2. The main design decision: normalized QTI objects, not literal XML trees

### Problem

XSD describes XML grammars. Zod validates JavaScript values. QTI 3.0.1 is especially awkward because it mixes:

- XML attributes like `xml:lang`, `xml:base`, `show-hide`, `outcome-identifier`
- XML extension points and foreign attributes
- structured QTI domain elements like interactions, declarations, sections, tests, and processing rules
- very large HTML/XHTML content models embedded inside item, stimulus, rubric, prompt, and feedback bodies

The “most XML-faithful” output would be a generic element/attribute tree, but that would make the schemas much less useful as application-facing TypeScript contracts.

### Decision

The port deliberately targets a **normalized parsed-XML representation**:

- XML attributes become regular JS properties
- element text becomes string content or `value`, depending on the node shape
- QTI domain nodes become named Zod object schemas
- cross-node validation is encoded with `.superRefine()` where the XSD alone is not enough
- extension points are preserved with explicit foreign-attribute and extension-node shapes

### Rationale

This keeps the resulting schemas useful as domain-level validation objects instead of just generic XML containers.

---

## 3. The important HTML-content decision

### Problem

The QTI XSD bundle contains a large number of HTML-oriented complex types alongside the core QTI domain types. Treating every HTML content-model type as a first-class hand-modeled Zod schema would add a large amount of surface area without adding much QTI-specific value.

At the same time, collapsing all markup to plain `z.string()` would lose important structure:

- embedded QTI elements inside content bodies
- XML include nodes
- MathML / foreign XML nodes
- renderable media and image references that QTI interactions depend on structurally

### Decision

The implementation **does not** model the HTML vocabulary one schema per XSD type, and it also **does not** reduce all content bodies to `z.string()`.

Instead it uses a normalized mixed-content model centered on:

- `QtiContentFragmentSchema`
- `QtiXmlContentNodeSchema`
- string literals for plain text runs
- first-class QTI nodes for interactions, feedback, template blocks, printed variables, hotspots, choices, gaps, and similar QTI-specific constructs

Renderable XML-ish content that is not worth specializing further is carried through `QtiXmlContentNodeSchema`, which preserves:

- element name
- optional namespace
- optional attributes
- optional child nodes
- optional string value

### Rationale

This is the middle ground that kept the port manageable:

- **more useful than** turning the entire content model into strings
- **far smaller than** recreating the entire HTML/XHTML type universe as dedicated schemas
- still expressive enough for item bodies, prompts, stimuli, and feedback content

In other words, the project chose to model **QTI semantics explicitly** and to carry most of the HTML surface as a normalized mixed-content layer.

---

## 4. Why there are “raw”, “document”, and “profile” layers

Some parts of the QTI bundle map directly to a root document schema:

- item
- section
- stimulus
- test
- metadata
- outcome declaration
- response processing
- assessment result
- access-for-all PNP

Other parts need more than one useful validation layer.

### Decision

The port uses three recurring layers:

1. **raw structural schemas** where the XSD shape itself is useful
2. **validated domain schemas** that add `.superRefine()` rules for obvious semantic constraints
3. **document/profile unions** for the resource families that the QTI package model treats as interchangeable validation entry points

Examples:

- `QtiAssessmentItemRawSchema` vs `QtiAssessmentItemSchema`
- `QtiAssessmentSectionRawSchema` vs `QtiAssessmentSectionSchema`
- `QtiAssessmentTestRawSchema` vs `QtiAssessmentTestSchema`
- `QtiItemProfileDocumentSchema`
- `QtiTestProfileDocumentSchema`
- `QtiAsiProfileDocumentSchema`

### Rationale

This mirrors the way the QTI bundle is actually used:

- some validations are “does this object have the declared XML structure?”
- others are “does this object satisfy the QTI semantics implied by declarations, bindings, and processing rules?”
- the ASI umbrella schema naturally becomes a union of resource-specific document entry points

---

## 5. File-family mapping decisions

## 5.1 `imsqti_asiv3p0p1_v1p0.xsd`

This is the umbrella schema and the main conceptual source for the internal shared model.

### Mapping decision

- the public facade exports the shared assessment, variable, and processing structures
- `QtiAsiProfileDocumentSchema` is modeled as a union of the resource-specific document schemas
- internal aliases and standalone document schemas are preserved where they help mirror the source bundle structure

### Rationale

The ASI schema is not best represented as one giant monolithic Zod object. In practice it is a bundle schema over several resource families, so the union model is clearer and more reusable.

---

## 5.2 `imsqti_itemv3p0p1_v1p0.xsd`, `imsqti_sectionv3p0p1_v1p0.xsd`, `imsqti_stimulusv3p0p1_v1p0.xsd`, `imsqti_testv3p0p1_v1p0.xsd`

These are the core assessment-structure XSDs.

### Mapping decision

- the heavy lifting lives in `assessment-internal.ts`
- the facade files stay small and expose the root document schema for each resource
- item, section, and test schemas add semantic validation around:
  - identifier uniqueness
  - declaration consistency
  - response binding compatibility
  - declared-outcome references from processing rules
  - section selection/order constraints
  - interaction-specific cardinality and bounds checks
  - “feedback content must not contain interactions” rules

### Rationale

These schemas are tightly interdependent. Putting the shared structures in one internal module avoids a large amount of duplication while preserving the public “one module per source XSD” shape.

---

## 5.3 `imsqti_outcomev3p0p1_v1p0.xsd` and `imsqti_responseprocessingv3p0p1_v1p0.xsd`

These are structurally smaller at the document level, but semantically important because they introduce reusable processing fragments and declarations.

### Mapping decision

- root documents stay simple and direct
- the actual declaration and processing-rule structures live in `variables-internal.ts` and `processing-internal.ts`
- validated declaration schemas enforce things like:
  - record cardinality omits `baseType`
  - record values require `fieldIdentifier`
  - mapping / areaMapping compatibility
  - mutually exclusive outcome tables
  - sensible min/max ordering

### Rationale

The root wrappers are thin; the meaning lives in the shared variable and processing model.

---

## 5.4 `imsqti_metadatav3p0_v1p0.xsd`

This is comparatively straightforward.

### Mapping decision

- the document root is direct
- enumerated metadata vocabularies are mapped as enums
- a small semantic rule ensures `portableCustomInteractionContext` is only present when the interaction list includes `portableCustomInteraction`

### Rationale

Metadata is simple enough to model almost literally, with only one obvious consistency check added.

---

## 5.5 `imsqti_resultv3p0_v1p0.xsd`

Result reporting is structurally direct, but it has important runtime-model constraints around cardinality and fielded values.

### Mapping decision

- separate schemas exist for context, test results, item results, and variable families
- validated result-variable schemas enforce:
  - `record` cardinality omits `baseType`
  - record-valued entries require `fieldIdentifier`
  - non-record values must not carry `fieldIdentifier`

### Rationale

These are good examples of constraints that are easy to lose if the model stops at raw structure. The validated result-variable layer is therefore part of the real document shape, not just an optional extra.

---

## 5.6 `imsqtiv3p0_afa3p0pnp_v1p0.xsd`

The PNP schema is a domain-specific preferences/configuration bundle.

### Mapping decision

- it is modeled as plain nested objects with enums and booleans where possible
- targeted semantic checks are added where the XSD intent is operationally obvious, such as:
  - mutually exclusive additional-testing-time controls
  - `allContent` magnification not being combined with `text`/`nonText`

### Rationale

This schema is configuration-like rather than markup-heavy, so a direct normalized object model is the most practical fit.

---

## 6. Processing expressions: what is now explicit

The processing model originally had a catch-all `QtiOpaqueExpressionSchema` for a set of real QTI operators. That was too generic for the actual project goals.

### Decision

These operators are now modeled as first-class schemas:

- `anyN`
- `customOperator`
- `equalRounded`
- `fieldValue`
- `index`
- `inside`
- `mathOperator`
- `patternMatch`
- `repeat`
- `roundTo`
- `statsOperator`
- `stringMatch`
- `substring`
- `testVariables`
- `numberCorrect`
- `numberIncorrect`
- `numberPresented`
- `numberResponded`
- `numberSelected`
- `outcomeMinimum`
- `outcomeMaximum`

The binary operator family also explicitly includes:

- `integerDivide`
- `integerModulus`

### Semantic rules added

Where the XSD intent is unambiguous and cheap to enforce, the processing layer also validates:

- numeric min/max ordering for `randomInteger` and `randomFloat`
- valid range and child-count relationships for `anyN`
- positive literal indexes / repeat counts / figures where appropriate
- `mathOperator` arity, especially `atan2`

### Rationale

These are real QTI domain operators, not just lexical XML details. Leaving them opaque would have made the port structurally incomplete in one of the most important parts of the spec.

---

## 7. What is still intentionally approximate

### 7.1 Full HTML/XHTML lexical fidelity

The port does not recreate every HTML complex type as a dedicated first-class Zod schema.

That is intentional.

### 7.2 Full XML namespace/prefix fidelity

The model preserves extension/foreign-node information, but it does not attempt to preserve every original XML lexical distinction exactly as written in the source document.

### 7.3 `customOperator` behavior

`customOperator` is structurally modeled, but its runtime meaning is intentionally open-ended because the spec itself presents it as an extension point.

### 7.4 Some processing semantics remain type-level rather than evaluation-level

The Zod schemas validate object shape and a useful subset of semantic invariants. They do not attempt to fully execute QTI processing semantics or prove all runtime typing rules for every expression tree.

### Rationale

These limitations are acceptable because the project goal is a practical schema layer for parsed QTI objects, not a full XML round-tripper or a QTI execution engine.

---

## 8. How to interpret the output structure

The main public entry points are:

- `packages/contracts/src/qti/v3_0_1/index.ts`
- `Qti301DerivedZodTemplates`

Important groupings:

- **resource document schemas**
  - `QtiAssessmentItemDocumentSchema`
  - `QtiAssessmentSectionDocumentSchema`
  - `QtiAssessmentStimulusDocumentSchema`
  - `QtiAssessmentTestDocumentSchema`
  - `QtiOutcomeDeclarationDocumentSchema`
  - `QtiOutcomeProcessingDocumentSchema`
  - `QtiResponseProcessingDocumentSchema`
  - `QtiMetadataDocumentSchema`
  - `QtiAssessmentResultDocumentSchema`
  - `QtiAccessForAllPnpDocumentSchema`
  - `QtiAccessForAllPnpRecordsDocumentSchema`

- **profile unions**
  - `QtiItemProfileDocumentSchema`
  - `QtiTestProfileDocumentSchema`
  - `QtiAsiProfileDocumentSchema`

- **shared XML helpers**
  - `QtiXmlExtensionNodeSchema`
  - `QtiXmlExtensionNodeListSchema`

- **internal structural hubs**
  - `assessment-internal.ts`
  - `variables-internal.ts`
  - `processing-internal.ts`

The mental model is:

- use the facade files and barrel for stable public document schemas
- treat the internal modules as the normalized shared model backing those documents

---

## 9. If this were taken further

The next likely improvements would be:

1. more expression-level semantic validation, especially where variable typing across processing trees can be checked cheaply
2. more negative tests around profile unions and cross-document invariants
3. deeper specialization of selected HTML-adjacent content nodes only where that adds clear QTI-specific value

The important point is that the project is already beyond “raw structural scaffolding”: it now has a substantial domain model, real semantic constraints, and a documented rationale for the places where it intentionally stays approximate.
