---
"@conform-ed/qti-react": minor
---

Expose the scoring engine on the `/headless` entry point. The Response Processing
interpreter (`executeResponseProcessing`, `collectRpIssues`), the standard per-response
scoring templates (`scoreResponse`, `matchCorrect`, `mapResponse`, `mapResponsePoint`,
`foldString`), the item-score aggregator (`effectiveItemScore`), the attempt store
(`createAttemptStore`), and the test-level outcome-processing controller
(`createTestController`) — plus their value/scoring types — are now re-exported from
`@conform-ed/qti-react/headless` alongside the existing normalize adapters and capability
gate. These modules are all framework-light, so a server (e.g. an authoritative QTI grade
finalize) can run the scoring engine without pulling React. No new logic; export surface
only. `effectiveItemScore` is also newly exported from the package root.
