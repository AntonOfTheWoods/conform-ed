export const ociImages = ["lrs-runner", "cmi5-runner"] as const;

export type OciImageName = (typeof ociImages)[number];

export type ImageCatalogContext = {
  registry: string;
  namespace: string;
  versionTag: string;
  revision: string;
  createdAtIso: string;
};

export function imageRef(image: OciImageName, tag: string, registry: string, namespace: string): string {
  return `${registry}/${namespace}/${image}:${tag}`;
}

export function imageTags(versionTag: string, revision: string, latestTagEnabled: boolean): string[] {
  const shortSha = revision.slice(0, 12);
  const tags = [versionTag, `sha-${shortSha}`];

  if (latestTagEnabled) {
    tags.push("latest");
  }

  return tags;
}

export function compatibilityProfile(image: OciImageName): string {
  if (image === "lrs-runner") {
    return "none";
  }

  return "1.0.0";
}

export function releaseManifest(
  context: ImageCatalogContext,
  latestTagEnabled: boolean,
): {
  generatedAt: string;
  release: {
    registry: string;
    namespace: string;
    versionTag: string;
    revision: string;
  };
  images: Array<{
    name: OciImageName;
    refs: string[];
    compatibility: {
      profileVersion: string;
      runnerContractVersion: string;
    };
  }>;
} {
  const tags = imageTags(context.versionTag, context.revision, latestTagEnabled);

  return {
    generatedAt: context.createdAtIso,
    release: {
      registry: context.registry,
      namespace: context.namespace,
      versionTag: context.versionTag,
      revision: context.revision,
    },
    images: ociImages.map((image) => ({
      name: image,
      refs: tags.map((tag) => imageRef(image, tag, context.registry, context.namespace)),
      compatibility: {
        profileVersion: compatibilityProfile(image),
        runnerContractVersion: "1.0.0",
      },
    })),
  };
}
