# Release Process

## v0.x Policy

Release channel is OCI-only.

Current OCI release surface:

- `lrs-runner`
- `cmi5-runner`

These are the only OCI images published by the GitHub Actions image workflow.

- publish target: GHCR
- optional mirror: Docker Hub (disabled by default)
- npm publish: deferred

## Versioning

- use Changesets for version intent and changelog.
- release tags should follow semver-compatible form, including RC tags.

Examples:

- `v0.1.0-rc.1`
- `v0.1.0`

## Release Steps

1. Ensure branch is green: `bun run validate`.
2. Generate or update changesets.
3. Run versioning step: `bun run version-packages`.
4. Build images: `bun run images:build`.
5. Publish images to GHCR: `bun run images:publish:ghcr`.
6. Emit release manifest: `bun run images:manifest`.
7. Run pull-based smoke verification: `bun run images:smoke`.
8. Publish release notes/changelog.

## Image Metadata

Image builds should include OCI labels:

- source repository
- revision SHA
- version tag
- creation timestamp

Release tooling now emits a machine-readable OCI release manifest including image refs and compatibility hints.

Smoke verification validates:

- each published tag is pullable
- required OCI labels are present (`title`, `version`, `revision`, `source`, `created`)

## Rollback Guidance

- keep immutable SHA-tagged images for each publish.
- avoid force-reusing version tags.
- use previous SHA tag for rollback.
