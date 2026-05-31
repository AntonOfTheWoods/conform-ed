export const defaultVersion = "2.0.0";

export const availableVersions = ["1.0.3", "2.0.0"];

export const specToFolder: Record<string, string> = {
  "1.0.3": "v1_0_3",
  "2": "v2_0",
  "2.0": "v2_0",
  "2.0.0": "v2_0",
};

export function getSpecFromFolder(folder: string): string | null {
  if (folder.includes("v1_0_3")) {
    return "1.0.3";
  }

  if (folder.includes("v2_0")) {
    return "2.0.0";
  }

  return null;
}

export default {
  defaultVersion,
  availableVersions,
  specToFolder,
  getSpecFromFolder,
};
