const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
const versionTag = process.env.VERSION_TAG ?? "local";
const revision = process.env.GITHUB_SHA ?? "dev";
const shortSha = revision.slice(0, 12);

for (const image of [
  "lrs-runner",
  "cmi5-runner",
  "lti13-runner",
  "cmi5-adapter-reference",
  "lti13-adapter-reference",
]) {
  console.log(`${registry}/${namespace}/${image}:${versionTag}`);
  console.log(`${registry}/${namespace}/${image}:sha-${shortSha}`);
}
