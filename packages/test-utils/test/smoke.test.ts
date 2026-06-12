import { expect, test } from "bun:test";

import { tempDir } from "../src/temp-dir";

test("tempDir returns tmp path", () => {
  expect(tempDir()).toContain("tmp");
});
