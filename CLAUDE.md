# conform-ed — AI Agent Instructions

## Package Manager

Always use **bun** for all package operations. Never use `npm`, `yarn`, or `pnpm`.

- `bun install` — install dependencies
- `bun run <script>` — run scripts
- `bun publish --access public` — publish packages (never `npm publish`)
- `bun info <pkg>` — check package info

## Temporary Files

Temporary files, scratch scripts, logs, and one-off artifacts must go under `tmp/` (repo root).
Never create temporary files in source directories or at repo root.

## Publishing Packages

Before publishing any package to the npm registry:

1. **Commit all changes** — every source change that is part of the release must be committed.
2. **Create a git tag** — tag the commit with the version being published:
   ```
   git tag packages/contracts/v<version>
   ```
   Use the format `packages/<name>/v<version>` for individual package tags.
3. **Then publish** — `bun publish --access public` from the package directory.

Never publish without a corresponding commit and tag. This ensures the registry artifact is always traceable to a specific revision.

## Type Checking

Use `bun run typecheck` — not `tsc` or `bunx tsgo --noEmit` directly.
