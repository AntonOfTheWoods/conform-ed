# LRS Typing Migration Protocol

This protocol adds shared Zod-driven types to both repositories with one oracle-validation cycle.

## Goal

- Use `@conform-ed/contracts` xAPI types as the canonical type source.
- Perform behavior-sensitive rewrites in `lrs-conformance-ts` first.
- Reuse the already-validated code in `conform-ed/apps/lrs-runner`.
- Run upstream oracle/parity once in `lrs-conformance-ts`, then run local `conform-ed` validation gates.

## Scope

- Migration workbench repository: `lrs-conformance-ts`.
- Consumer repository: `conform-ed`.
- Type source: `conform-ed/packages/contracts`.

## Non-Goals

- Do not change xAPI behavioral semantics during migration.
- Do not weaken standards-driven contracts to satisfy convenience access patterns.
- Do not duplicate migration logic independently in both repositories.

## Phase 0: Preconditions

1. Confirm both repositories are at known commits and record SHAs.
2. Confirm no in-flight integration test containers from prior runs.
3. Confirm `conform-ed/packages/contracts` typecheck and lint pass.
4. Confirm `lrs-conformance-ts` baseline `validate` passes before migration.
5. Before changing any conformance suite code or any Zod template, validate the exact xAPI spec text for the target version and record the cited rule.
6. If the spec and current code disagree, treat the spec as the source of truth unless the repository has an explicitly documented, version-scoped compatibility exception.

## Phase 1: Temporary Local Type Source

In `lrs-conformance-ts`:

1. Add a temporary dev dependency on local `@conform-ed/contracts` via file path.
2. Import only contract type entrypoints that map to runtime versioned suites.
3. Keep this dependency temporary until publish and swap.

Expected outcome:

- `lrs-conformance-ts` can compile against the same types used by `conform-ed`.

## Phase 2: Shared Migration Helpers

Create small helper utilities in `lrs-conformance-ts` test runtime code:

1. Typed response parser helper for JSON/text response bodies.
2. Narrowing helpers for Statement object unions.
3. Narrowing helpers for optional context and context activities arrays.
4. Assertion-friendly guards that throw explicit template-shape errors.

Expected outcome:

- Rewrites are repetitive and mechanical, not custom per test file.

## Phase 3: Rewrite Order (Cheap to Expensive)

Apply migration in this order:

1. Retrieval and statement-resource files for both xAPI versions.
2. Statement lifecycle and formatting files.
3. Communication headers/content/multipart files.
4. Remaining suite files with low statement-object interaction.

Per file checklist:

1. Validate the relevant spec clause for the exact version before editing the file.
2. Replace `any`/`unknown` where shape is known by spec.
3. Replace direct union property access with narrowing helpers.
4. Replace untyped id array response handling with `string[]`.
5. Keep explicit runtime guards where templates can vary.
6. If the fixture or template shape differs from the spec, fix the fixture/template only after recording the spec citation and the reason for the compatibility bridge.

## Phase 4: Oracle and Parity Gate (Only in `lrs-conformance-ts`)

Run the full behavior gate in `lrs-conformance-ts`:

1. `bun run typecheck`
2. `bun run lint`
3. `bun run test`
4. Existing upstream oracle/parity flows used by the team.

Acceptance criteria:

1. No behavioral drift against upstream oracle beyond pre-approved tolerances.
2. No newly introduced parity regressions.
3. No unresolved typing suppressions for migrated files.

## Phase 5: Sync into `conform-ed`

1. Copy migrated runtime test code from `lrs-conformance-ts` into `conform-ed/apps/lrs-runner/runtime/test`.
2. Keep folder parity between versioned suites to reduce merge friction.
3. Reconcile any helper signature differences in one place.

Validation in `conform-ed`:

1. `bun run --cwd packages/contracts typecheck`
2. `bun run --cwd packages/contracts lint`
3. `bun run --cwd apps/lrs-runner typecheck`
4. `bun run --cwd apps/lrs-runner lint`

## Phase 6: Publish and Dependency Swap

1. Publish `@conform-ed/contracts` and other planned release artifacts from `conform-ed`.
2. In `lrs-conformance-ts`, replace temporary local file dependency with published semver version.
3. Re-run `lrs-conformance-ts` `validate` and oracle/parity gate.

Done criteria:

1. `lrs-conformance-ts` runs against published `@conform-ed/contracts` without local linking.
2. `conform-ed` and `lrs-conformance-ts` compile against the same standards-driven type surface.
3. Oracle parity remains acceptable.

## Decision Rules: Adapt Types vs Tighten Code

Tighten code when:

1. Access depends on optional or union fields (`Statement.object`, `contextActivities.category`, optional `context`).
2. The test assumes a specific template shape that must be asserted before access.

Adapt helper types when:

1. Runtime behavior already supports a looser call signature.
2. The change is transport/helper plumbing and not xAPI domain semantics.

Do not adapt contracts when:

1. The change would hide standards-accurate optionality/union constraints.
2. The motivation is to avoid writing guards in conformance test code.

Spec-first rule:

1. No code edit.
2. No Zod template edit.
3. No helper rewrite.
4. No fixture rewrite.

All four require a prior spec citation for the target version and clause.

## Rollback Plan

1. Keep migration in small commits grouped by file family.
2. If parity breaks, revert only the latest file family batch.
3. Keep helper-level changes isolated so they can be reverted independently.

## Traceability

For each migrated batch, record:

1. Files touched.
2. Types introduced.
3. Guard helpers introduced or reused.
4. Oracle/parity result summary.

Store traceability notes in the migration ledger used by the LRS migration docs.
