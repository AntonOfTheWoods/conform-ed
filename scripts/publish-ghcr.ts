const images = [
  "lrs-runner",
  "cmi5-runner",
  "lti13-runner",
  "cmi5-adapter-reference",
  "lti13-adapter-reference",
] as const;

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

function makeRef(image: string, tag: string, registry: string, namespace: string): string {
  return `${registry}/${namespace}/${image}:${tag}`;
}

const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
const versionTag = process.env.VERSION_TAG ?? "local";
const revision = process.env.GITHUB_SHA ?? "dev";
const shortSha = revision.slice(0, 12);
const dryRun = process.env.IMAGE_DRY_RUN !== "0";
const latestTagEnabled = process.env.IMAGE_TAG_LATEST === "1";

for (const image of images) {
  const tags = [
    makeRef(image, versionTag, registry, namespace),
    makeRef(image, `sha-${shortSha}`, registry, namespace),
  ];
  if (latestTagEnabled) {
    tags.push(makeRef(image, "latest", registry, namespace));
  }

  for (const ref of tags) {
    run(["podman", "push", ref], dryRun);
  }
}
