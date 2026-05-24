# @conform-ed/contracts

Shared runtime contracts and zod schemas for runner config and output.

Implementation notes for the XSD-to-Zod ports live alongside this package:

- `packages/contracts/caliper-v1_2-zod-templates.md`
- `packages/contracts/cmi5-v1_0-zod-templates.md`
- `packages/contracts/xapi-zod-templates.md`
- `packages/contracts/case-v1_1-zod-templates.md`
- `packages/contracts/cat-v1_0-zod-templates.md`
- `packages/contracts/cc-v1_3-zod-templates.md`
- `packages/contracts/cc-v1_4-zod-templates.md`
- `packages/contracts/clr-v2_0-zod-templates.md`
- `packages/contracts/lti-zod-templates.md`
- `packages/contracts/open-badges-v3_0-zod-templates.md`
- `packages/contracts/oneroster-v1_2-zod-templates.md`
- `packages/contracts/qti-v2_1-zod-templates.md`
- `packages/contracts/qti-v2_2-zod-templates.md`
- `packages/contracts/qti-v3_0_1-zod-templates.md`
- `packages/contracts/vc-data-model-v2_0-zod-templates.md`

Versioned schema bundles are exported from the package root as namespaces:

- `CaliperV1_2`
- `Cmi5`
- `Cmi5V1_0`
- `Xapi`
- `XapiV1_0_3`
- `XapiV2_0`
- `CaseV1_1`
- `CatV1_0`
- `CommonCartridgeV1_3`
- `CommonCartridgeV1_4`
- `ClrV2_0`
- `Lti`
- `LtiV1_3`
- `LtiDeepLinkingV2_0`
- `LtiAgsV2_0`
- `LtiNrpsV2_0`
- `LtiProctoringV1_0`
- `OpenBadgesV3_0`
- `OneRosterV1_2`
- `QtiV2_1`
- `QtiV2_2`
- `QtiV3_0_1`
- `VcDataModelV2_0`

XML intake, example inventory, and file/folder validation helpers now live alongside this package in:

- `packages/qti-xml`
- `packages/cli`
