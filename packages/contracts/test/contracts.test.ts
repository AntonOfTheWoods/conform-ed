import { expect, test } from "bun:test";
import { RunnerConfigSchema } from "../src/config";

test("RunnerConfigSchema parses minimal config", () => {
  const parsed = RunnerConfigSchema.parse({
    suite: { name: "lrs", target: "all" },
  });

  expect(parsed.contractVersion).toBe("1.0.0");
});
