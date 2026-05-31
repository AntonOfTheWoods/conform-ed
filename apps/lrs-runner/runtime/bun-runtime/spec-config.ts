export const defaultXapiVersion = "2.0.0" as const;

export const specToFolder = {
  "1.0.3": "v1_0_3",
  "2": "v2_0",
  "2.0": "v2_0",
  "2.0.0": "v2_0",
} as const;

export type SupportedXapiVersion = "1.0.3" | "2.0.0";
export type SupportedXapiDirectory = "v1_0_3" | "v2_0";

export function resolveXapiVersionFolder(version: string): SupportedXapiDirectory | undefined {
  return specToFolder[version as keyof typeof specToFolder];
}

export function getSpecFromFolder(folder: string): SupportedXapiVersion | undefined {
  if (folder.includes("v1_0_3")) {
    return "1.0.3";
  }

  if (folder.includes("v2_0")) {
    return "2.0.0";
  }

  return undefined;
}
