# Image Strategy

## Distribution Policy

v0.x release channel is OCI-only.

- primary registry: GHCR
- Docker Hub mirror: optional and disabled by default

## Image Set

Published images:

- `lrs-runner`
- `cmi5-runner`
- `lti13-runner`
- `cmi5-adapter-reference`
- `lti13-adapter-reference`

## Tag Strategy

Build/publish scripts support:

- `VERSION_TAG` for release labels (for example `v0.1.0-rc.1`)
- `sha-<short_sha>` traceability tags
- optional `latest` tag through explicit opt-in

## OCI Metadata Labels

Images should include labels aligned with OCI recommendations:

- `org.opencontainers.image.title`
- `org.opencontainers.image.version`
- `org.opencontainers.image.revision`
- `org.opencontainers.image.source`
- `org.opencontainers.image.created`

## Build Runtime

Build scripts assume Podman CLI.

GitHub Actions image workflow installs and uses Podman, then authenticates to GHCR before pushing tags.

## Release Candidate Flow

For first release candidates:

1. derive `VERSION_TAG` from git tag when available.
2. otherwise derive `VERSION_TAG` from workflow run metadata as RC tag.
3. build with OCI labels and push GHCR tags.

## Reproducibility Notes

- Pin Bun runtime version in Containerfiles.
- Keep container build context deterministic.
- Keep image publishing scripts idempotent for reruns on the same commit.
