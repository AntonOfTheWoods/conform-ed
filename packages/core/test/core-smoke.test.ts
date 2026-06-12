import { expect, test } from "bun:test";

import { runSuiteStub } from "../src/runner";

test("runSuiteStub resolves", async () => {
  const result = await runSuiteStub();
  expect(result.status).toBe("passed");
});
