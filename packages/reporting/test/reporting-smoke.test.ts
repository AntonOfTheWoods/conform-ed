import { expect, test } from "bun:test";

import { defaultArtifactFiles } from "../src/artifact-layout";

test("defaultArtifactFiles includes summary", () => {
  expect(defaultArtifactFiles()).toContain("summary.json");
});
