# Caliper Analytics v1.2 JSON schema bundle -> Zod template notes

## Published specification

- Main specification: `https://www.imsglobal.org/spec/caliper/v1p2/impl/`
- Canonical source repository: `https://github.com/1EdTech/caliper-spec`
- Practical JSON schema corpus used for this implementation: `https://github.com/1EdTech/CaliperBootcamp/tree/main/schemas/v1_2`

This note accompanies `packages/contracts/src/caliper/v1_2/`.

---

## 1. Source precedence used for this implementation

To align with textual spec intent while remaining interoperable with published artifacts, this implementation follows an explicit precedence order:

1. `https://www.imsglobal.org/spec/caliper/v1p2` (normative textual specification)
2. `https://www.imsglobal.org/spec/caliper/v1p2/impl/` (implementation guide clarifications)
3. `tmp/CaliperBootcamp/schemas/v1_2/*` (machine-readable compatibility corpus)

This precedence is exported in code via `CALIPER_REQUIREMENT_SOURCE_PRECEDENCE` and related metadata.

---

## 2. What was implemented

This port adds a versioned Caliper v1.2 bundle with:

- Caliper envelope schema
- full published Action/Profile/Metric/Status vocabularies
- base event contracts and all Bootcamp v1.2 event entry points
- base entity contracts and all Bootcamp v1.2 entity entry points
- SystemIdentifier, CaliperData, Selector/TextPositionSelector helper schemas
- an explicit published-entry-point map (`CaliperV1P2JsonSchemaEntryPoints`)

Public package surface:

- root namespace: `CaliperV1_2`
- subpath export: `@conform-ed/contracts/caliper/v1_2`

---

## 3. Structural choices

The implementation is split into:

- `shared.ts` for shared context, datetime, IRI/UUID, reference, and entity/event schema builders
- `caliper_v1p2_bootcamp_schema.ts` for vocabulary and published entry-point schemas
- `textual_requirements.ts` for extracted event-level textual constraints and source metadata
- `index.ts` for barrel exports and `Caliper12DerivedZodTemplates`

This keeps Caliper-specific concerns isolated and aligned with existing versioned standards packages.

---

## 4. Validation choices

Implemented strict alignment upgrades:

- **Event id** requires UUID URN form (`urn:uuid:...`) via `CaliperEventIdSchema`
- **Datetime** requires ISO8601 UTC with millisecond precision (`YYYY-MM-DDTHH:mm:ss.SSSZ`)
- **Envelope** enforces required `sensor`, `sendTime`, `dataVersion`, and non-empty `data`
- **Envelope** is strict at top-level (no unknown custom envelope properties)
- **Event subtype constraints** are enforced for textual-spec-covered events:
  - supported actor type(s)
  - supported action terms (including documented deprecated terms where applicable)
  - supported object type(s)
  - supported generated/target entity type(s) where defined
- **Entity entry points** require `id`, `type`, and top-level `@context`
- **No-id entity alignment**: `TextPositionSelector` requires `type`, `start`, `end`; `SystemIdentifier` requires `type`, `identifier`, `identifierType`

`CaliperV1P2ConformanceMetadata` exposes the extracted textual rule set and identifies Bootcamp-only event types.

---

## 5. Coverage and known deviations

### Textual-spec covered event constraints

Event-level textual constraints are explicitly enforced for:

- `AnnotationEvent`
- `AssessmentEvent`
- `AssessmentItemEvent`
- `AssignableEvent`
- `ForumEvent`
- `GradeEvent`
- `MediaEvent`
- `MessageEvent`
- `NavigationEvent`
- `SessionEvent`
- `ThreadEvent`
- `ToolUseEvent`
- `ViewEvent`

### Bootcamp-only compatibility events

The following event types exist in Bootcamp v1.2 artifacts but are not fully constrained by the extracted textual rule set used in this implementation:

- `Event`
- `FeedbackEvent`
- `OutcomeEvent`
- `QuestionnaireEvent`
- `QuestionnaireItemEvent`
- `ReadingEvent`
- `ResourceManagementEvent`
- `SearchEvent`
- `SurveyEvent`
- `SurveyInvitationEvent`
- `ToolLaunchEvent`

These remain structurally validated but without the same actor/action/object subset enforcement as the textual-spec-covered list above.

### Additional explicit deviation notes

- Caliper context handling in public artifacts can vary between `v1p1` and `v1p2` context URIs; this implementation accepts both.
- Full per-entity property-table enforcement across all Appendix entity definitions is not yet exhaustive; current implementation focuses on base required semantics (`id`, `type`, context) plus key no-id entities and event/profile-level constraints.

---

## 6. Scope note

The 1EdTech Caliper implementation page does not currently publish an official machine-readable schema bundle comparable to some other standards in this repository. This implementation therefore uses the Bootcamp v1.2 schema corpus as the concrete source for operational Zod contracts, while keeping all spec links and versioning explicit.
