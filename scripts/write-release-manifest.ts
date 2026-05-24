import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { releaseManifest } from "./image-catalog";

const repoRoot = resolve(import.meta.dir, "..");
const defaultManifestPath = resolve(repoRoot, "tmp", "agents", "releases", "oci-release-manifest.json");

function ensureTmpPath(pathValue: string): string {
  const tmpRoot = resolve(repoRoot, "tmp");
  const resolved = resolve(repoRoot, pathValue);

  if (resolved !== tmpRoot && !resolved.startsWith(`${tmpRoot}/`)) {
    throw new Error(`release manifest path must be under ${tmpRoot}`);
  }

  return resolved;
}

const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
const versionTag = process.env.VERSION_TAG ?? "local";
const revision = process.env.GITHUB_SHA ?? "dev";
const latestTagEnabled = process.env.IMAGE_TAG_LATEST === "1";
const outputPath = ensureTmpPath(process.env.IMAGE_RELEASE_MANIFEST_PATH ?? defaultManifestPath);

const manifest = releaseManifest(
  {
    registry,
    namespace,
    versionTag,
    revision,
    createdAtIso: new Date().toISOString(),
  },
  latestTagEnabled,
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(outputPath);
