# LTI schema notes

The LTI contract bundle is split by spec family:

- `LtiV1_3` — normalized LTI 1.3 core launch claims
- `LtiDeepLinkingV2_0` — deep linking request settings and response content items
- `LtiAgsV2_0` — assignment and grade services endpoint, line item, score, and result payloads
- `LtiNrpsV2_0` — names and roles service claim plus membership container
- `LtiProctoringV1_0` — proctoring launch messages and assessment-control payloads

The schemas use normalized camelCase field names so they are easy to use from the adapter reference app and runner fixtures.
