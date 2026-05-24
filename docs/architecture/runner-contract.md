# Runner Contract

## Contract Objective

Expose one stable, vendor-neutral execution surface for all conformance runners.

## Command Surface

Required commands:

- `run`
- `validate-config`
- `print-schema`
- `list-targets`
- `version`

Adapter-aware suites also implement:

- `list-adapters`

## Required Inputs

All runners accept a JSON config matching `schemas/v1/config.schema.json`.

Shared config sections:

- `contractVersion`
- `suite`
- `sut`
- `auth`
- `selection`
- `timeouts`
- `artifacts`
- `debug`
- `adapter` (nullable)
- `suiteConfig`

## Required Outputs

Runner output must be machine-readable and deterministic:

- JSON command responses for non-run commands.
- `summary.json` shape aligned to `schemas/v1/summary.schema.json`.
- optional JUnit output.

## Exit Semantics

Recommended stable exit classing:

- success
- assertion failure
- invalid config
- adapter error
- runner internal error

Exact numeric mapping is implementation-specific but must remain stable once published.

## Compatibility Policy

1. Breaking command/config/output changes require a major contract bump.
2. New optional fields are minor-version compatible.
3. Deprecated fields remain supported through at least one minor release train.

## Security Expectations

- Never log bearer tokens.
- Redact sensitive config values in debug output.
- Fail closed on malformed auth where auth is required.

## Scope Boundaries

Runner responsibilities:

- protocol orchestration
- target selection
- conformance execution
- standardized reporting

Runner non-responsibilities:

- direct database setup
- platform-specific workflow assumptions
- bespoke app-layer provisioning logic
