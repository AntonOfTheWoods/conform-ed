import { imageRef, imageTags, ociImages } from "./image-catalog";

const registry = process.env.IMAGE_REGISTRY ?? "ghcr.io";
const namespace = process.env.IMAGE_NAMESPACE ?? "conform-ed";
const versionTag = process.env.VERSION_TAG ?? "local";
const revision = process.env.GITHUB_SHA ?? "dev";
const latestTagEnabled = process.env.IMAGE_TAG_LATEST === "1";
const tags = imageTags(versionTag, revision, latestTagEnabled);

for (const image of ociImages) {
  for (const tag of tags) {
    console.log(imageRef(image, tag, registry, namespace));
  }
}
