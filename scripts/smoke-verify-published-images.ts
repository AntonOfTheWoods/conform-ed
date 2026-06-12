import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { imageRef, imageTags, ociImages } from "./image-catalog";

type ReleaseManifest = {
  images: Array<{
    name: string;
    refs: string[];
  }>;
};

function run(command: string[]): void {
  const proc = Bun.spawnSync(command, {
    stdout: "inherit",
    stderr: "inherit",
  });

  if (proc.exitCode !== 0) {
    throw new Error(`Command failed (${proc.exitCode}): ${command.join(" ")}`);
  }
}

function runCapture(command: string[]): string {
  const proc = Bun.spawnSync(command, {
    stdout: "pipe",
    stderr: "pipe",
  });

  if (proc.exitCode !== 0) {
    const stderr = proc.stderr.toString("utf8");
    throw new Error(`Command failed (${proc.exitCode}): ${command.join(" ")}\n${stderr}`);
  }

  return proc.stdout.toString("utf8");
}

function refsFromEnvironment(): string[] {
  const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
  const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
  const versionTag = process.env.VERSION_TAG ?? "local";
  const revision = process.env.GITHUB_SHA ?? "dev";
  const latestTagEnabled = process.env.IMAGE_TAG_LATEST === "1";
  const tags = imageTags(versionTag, revision, latestTagEnabled);

  return ociImages.flatMap((image) => tags.map((tag) => imageRef(image, tag, registry, namespace)));
}

function refsFromManifest(manifestPath: string): string[] {
  const payload = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(payload) as ReleaseManifest;
  return manifest.images.flatMap((image) => image.refs);
}

const repoRoot = resolve(import.meta.dir, "..");
const manifestPathFromEnv = process.env.IMAGE_RELEASE_MANIFEST_PATH;
const resolvedManifestPath = manifestPathFromEnv ? resolve(repoRoot, manifestPathFromEnv) : null;
const refs = resolvedManifestPath ? refsFromManifest(resolvedManifestPath) : refsFromEnvironment();

for (const ref of refs) {
  run(["podman", "pull", ref]);

  const labelsRaw = runCapture(["podman", "image", "inspect", ref, "--format", "{{json .Labels}}"]).trim();
  if (!labelsRaw) {
    throw new Error(`Image ${ref} does not expose OCI labels.`);
  }

  const labels = JSON.parse(labelsRaw) as Record<string, string>;
  const requiredLabels = [
    "org.opencontainers.image.title",
    "org.opencontainers.image.version",
    "org.opencontainers.image.revision",
    "org.opencontainers.image.source",
    "org.opencontainers.image.created",
  ];

  for (const label of requiredLabels) {
    if (!labels[label] || labels[label].trim().length === 0) {
      throw new Error(`Image ${ref} is missing required label ${label}.`);
    }
  }

  console.log(`smoke-ok ${ref}`);
}
