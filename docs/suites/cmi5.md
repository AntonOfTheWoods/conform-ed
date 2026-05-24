# cmi5 Suite

## Scope

cmi5 runner provides conformance/oracle orchestration with explicit adapter integration for platform-specific workflow operations.

## Current Status

- runner status: executable LTS flow with requirement-trace artifacts
- adapter status: reference HTTP adapter with launch/import/fetch/launch-data/waive/abandon contract behavior

## Milestones

1. Capability-gated adapter handshake before execution.
2. Stable cmi5 target matrix for runtime/package/all modes.
3. First RC image tags with adapter-auth enforcement.

## Adapter Contract Dependencies

cmi5 execution depends on adapter support for operations like:

- fixture provisioning
- package import
- launch creation
- waive
- abandon

## Out of Scope for v0.x

- high-risk CATAPULT runtime assertions that require deep LMS/AU lifecycle orchestration.

## Implemented Requirement Coverage (Current)

- adapter preflight compatibility gate (capabilities + profile + operation contract)
- package import happy path and invalid base64 rejection
- package structure matrix validation (manifest shape, AU presence, AU launch URL and moveOn validity)
- launch creation baseline contract (registration/session/url/fetch/endpoint)
- launch URL query contract validation (fetch, registration, actor, activityId, endpoint, launchMode, moveOn, masteryScore, launchParameters)
- fetch-token exchange and launch-data resource validation, including single-use fetch behavior
- fetch/auth security matrix: missing/invalid fetch params, missing/invalid auth, cross-session auth misuse, and replay-request rejection
- fetch token and auth token expiry-window enforcement with explicit forbidden-path tests
- AU runtime/xAPI statement lifecycle matrix (initialized, launched, progressed, completed, passed/failed, terminated)
- moveOn-gated termination validation across Passed/Completed/CompletedAndPassed/CompletedOrPassed/NotApplicable
- actor/account and entitlement contract validation
- explicit learner/entitlement identity override matrix
- explicit launchId/registrationId/sessionId passthrough validation
- moveOn matrix and launchMode matrix round-trip checks
- contextTemplate extension/grouping consistency checks
- invalid launch payload matrix (mode/moveOn/mastery/identity/package fields)
- resume continuity and resume matrix checks
- registration waive and session abandon happy paths
- lifecycle-state propagation for waived registrations and abandoned sessions
- durable state reload matrix for waived/abandoned lifecycle continuity across restart simulation
- cross-system integration matrix for interleaved multi-session lifecycle isolation and auth boundary checks
- external process-orchestration lane that boots adapter independently and runs cmi5 runner via config-based contract
- invalid waive/abandon payload matrix
- CATAPULT parity ledger artifact (`catapult-parity-ledger.json`) generated alongside summary/trace metadata
