# LRS Suite

## Scope

LRS runner is in scaffold-reset mode while the next runtime integration is prepared.

Initial focus:

- stable CLI and config surface
- deterministic about-endpoint smoke execution against a target LRS
- lane scaffolding for local compose, external endpoints, and OCI wrappers

## Current Status

- runner status: previous copied integration is being cleaned out
- command surface: preserved (`run`, `validate-config`, `print-schema`, `list-targets`, `version`)
- lane scripts: preserved and pointed to scaffold behavior
- docs: reset to neutral placeholders pending new runtime import

## Milestones

1. Complete scaffold cleanup from previous integration.
2. Integrate the new runtime implementation.
3. Re-enable full conformance semantics and OCI verification.
4. Ship first RC with stable reports and lane behavior.

## Inputs and Constraints

- All artifacts must stay under `tmp/agents/`.

## Out of Scope for v0.x

- final protocol parity claims before the new runtime import is complete.
- migration of historical audit tooling into this repository.

## Lanes

- Runner lane: `bun run apps/lrs-runner/src/cli.ts run --base-url <url> --version <1.0.3|2.0.0>`
- LRSQL lane: `bun run test:lrs:lrsql`
- Generic external lane: `bun run test:lrs:external -- --base-url <url> --version <1.0.3|2.0.0>`
- OCI smoke lane: `bun run test:lrs:oci-smoke -- --base-url <url> --version <1.0.3|2.0.0>`
- LRSQL services: `bun run lrsql:up`, `bun run lrsql:down`, `bun run lrsql:wait`, `bun run lrsql:auth:check`

Current scaffold behavior runs an about-endpoint check and writes machine-readable JSON output with stable top-level fields (`generatedAt`, `target`, `run`).
