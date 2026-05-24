# lrs-runner

LRS conformance runner scaffold for conform-ed.

The outward command surface is intentionally preserved while internals are being reset for re-integration.

Current status:

- `src/cli.ts` keeps `run`, `validate-config`, `print-schema`, `list-targets`, and `version` commands.
- `src/run.ts` performs a minimal about-endpoint smoke check.
- legacy copied suite internals are not part of the active scaffold surface.
