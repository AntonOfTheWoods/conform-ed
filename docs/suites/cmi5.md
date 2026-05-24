# cmi5 Suite

## Scope

cmi5 runner provides conformance/oracle orchestration with explicit adapter integration for platform-specific workflow operations.

## Current Status

- runner status: stub
- adapter status: reference HTTP adapter stub

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

- full CATAPULT parity and product-specific platform implementations.
