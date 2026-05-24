# QTI 2.2 Zod templates

## Published specification

- Overview: `https://www.imsglobal.org/question/qtiv2p2/imsqti_v2p2_oview.html`

`tmp/qti/2.2/` extends the 2.1 model with stimulus documents, HTML5 helper XSDs, curriculum standards metadata, richer APIP accessibility, and a larger QTI content-package profile. The implementation lives in `packages/contracts/src/qti/v2_2/` and keeps the same normalized public style as the rest of this package.

## Implementation shape

- `imsqti_v2p2p4.ts` covers the main assessment object family:
  - `assessmentItem`
  - `assessmentSection`
  - `assessmentStimulus`
  - `assessmentTest`
  - declarations
  - processing fragments
  - item / stimulus body / feedback / interaction nodes
- `imsqtiv2p2p4_html5_v1p0.ts` exports the normalized HTML5-oriented content helpers used by the main schemas
- `imsqti_metadata_v2p2.ts` covers `qtiMetadata`
- `imsqti_result_v2p2.ts` covers `assessmentResult`
- `imsqti_usagedata_v2p2.ts` covers `usageData`
- `qtiv2p2_csm_v2p2.ts` covers curriculum standards metadata
- `qtiv2p2_imscpv1p2_v1p0.ts` covers the QTI 2.2 packaging profile
- `apipv1p0_qtiextv2p2_v1p0p1.ts` covers the APIP accessibility extension surface

## Key choices

1. QTI 2.2 reuses the shared 2.x internal implementation with version-specific switches for stimulus support, scoring-mode metadata, curriculum standards metadata, APIP supplemental accessibility, and packaging resource types.
2. The HTML5 XSD is represented by normalized generic content nodes instead of hundreds of exported per-tag schemas. This matches the practical role of those types in the source bundle: markup containers, not core assessment domain objects.
3. `assessmentStimulus` and `assessmentStimulusRef` are modeled explicitly because they are a real 2.2 domain addition, not merely more markup.
4. The local bundle is also missing the full imported MathML / SSML support trees. As with 2.1, that is treated as a content-vocabulary concern rather than a blocker for the QTI domain/object schemas.
