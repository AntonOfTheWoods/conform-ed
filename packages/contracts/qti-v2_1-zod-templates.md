# QTI 2.1 Zod templates

## Published specification

- Overview: `https://www.imsglobal.org/question/qtiv2p1/imsqti_oviewv2p1.html`
- Assessment/item/test information model: `https://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html`
- Results Reporting v2.1: `https://www.imsglobal.org/question/qtiv2p1/imsqti_resultv2p1.html`

`tmp/qti/2.1/` ships a small bundle of entry-point XSDs plus imported helper trees (`metadata/`, `other/`). The implementation lives in `packages/contracts/src/qti/v2_1/` and follows the same normalized parsed-XML style as the existing QTI 3.0.1 port: arrays are pluralized, embedded XML extension points are normalized into explicit `extensions` / `foreignAttributes`, and public entry points are exposed as document schemas plus a version registry.

## Implementation shape

- `imsqti_v2p1p2.ts` covers the main assessment object family:
  - `assessmentItem`
  - `assessmentSection`
  - `assessmentTest`
  - declarations
  - processing fragments
  - item body / feedback / interaction nodes
- `imsqti_metadata_v2p1.ts` covers `qtiMetadata`
- `imsqti_result_v2p1.ts` covers `assessmentResult`
- `imsqti_usagedata_v2p1.ts` covers `usageData`
- `qtiv2p1_imscpv1p2_v1p0.ts` covers the QTI 2.1 content-package profile
- `apipv1p0_qtiextv2p1_v1p0.ts` covers the APIP accessibility extension surface used from items/feedback

## Key choices

1. QTI 2.1 and QTI 2.2 share one internal 2.x implementation core because the source domain model is structurally the same; the version directories only specialize the places where the bundles materially differ.
2. HTML / XHTML / MathML body content is normalized as generic recursive content nodes instead of one exported Zod schema per markup tag. The domain objects still stay explicit, but the huge markup vocabulary remains tractable.
3. APIP is modeled as a focused normalized accessibility surface rather than a full schema-for-schema transcription of every auxiliary APIP type. The item-facing accessibility structures are explicit; deeper companion-material payload details stay permissive.
4. The bundled MathML helper tree is incomplete locally. That does not block the port because those imported vocabularies are treated as generic normalized content subtrees rather than locally-resolved schema dependencies.

## QTI Results Reporting assessment (v2.1)

QTI Results Reporting is published as a distinct document set within the QTI family, but for implementation purposes in this repo it is already covered in the versioned QTI contract surface:

- `imsqti_result_v2p1.ts` exposes `QtiAssessmentResultDocumentSchema`
- `imsqti_usagedata_v2p1.ts` exposes `QtiUsageDataDocumentSchema`
- `src/qti/v2_1/index.ts` includes both under `Qti21DerivedZodTemplates`

Assessment outcome for v2.1:

1. It is a separate spec document family, but not a separate package requirement in this repo.
2. Current coverage is functionally in place for results (`assessmentResult`) and usage (`usageData`) document entry points.
3. No additional standalone `qti-results-reporting` package is required unless we later want a cross-version aggregate facade.
