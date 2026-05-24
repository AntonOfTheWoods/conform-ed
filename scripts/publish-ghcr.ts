import { imageRef, imageTags, ociImages } from "./image-catalog";

function run(command: string[], dryRun: boolean): void {
  if (dryRun) {
    console.log(command.join(" "));
    return;
  }

  const proc = Bun.spawnSync(command, {
    stdout: "inherit",
    stderr: "inherit",
  });

  if (proc.exitCode !== 0) {
    throw new Error(`Command failed (${proc.exitCode}): ${command.join(" ")}`);
  }
}

const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
const versionTag = process.env.VERSION_TAG ?? "local";
const revision = process.env.GITHUB_SHA ?? "dev";
const dryRun = process.env.IMAGE_DRY_RUN !== "0";
const latestTagEnabled = process.env.IMAGE_TAG_LATEST === "1";
const tags = imageTags(versionTag, revision, latestTagEnabled);

for (const image of ociImages) {
  const refs = tags.map((tag) => imageRef(image, tag, registry, namespace));

  for (const ref of refs) {
    run(["podman", "push", ref], dryRun);
  }
}
