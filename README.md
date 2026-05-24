# conform-ed

conform-ed is an open-source monorepo for standards conformance tooling.

## Scope

- LRS conformance runner
- cmi5 conformance/oracle runner
- LTI 1.3 conformance runner
- Reference adapter services for cmi5 and LTI 1.3
- Shared contracts, schemas, reporting, and CI workflows

## Stack

- Bun workspaces
- Turbo
- TypeScript Native (`tsgo`)
- `oxlint` + `oxfmt`
- Podman for local container workflows

## Release Strategy

First release train is OCI-only.

- Primary registry: GHCR
- Optional mirror: Docker Hub (disabled by default)
- No npm publishing in v0.x

## Quickstart

```bash
bun install
bun run validate
```

See `docs/development/getting-started.md` for details.
