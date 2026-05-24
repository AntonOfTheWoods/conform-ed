import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RunnerConfigSchema } from "../src/config";
import { RunnerSummarySchema } from "../src/summary";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("example configs parse with RunnerConfigSchema", () => {
  const root = resolve(import.meta.dir, "..", "..", "..");
  const configs = [
    resolve(root, "examples/configs/lrs.basic.json"),
    resolve(root, "examples/configs/cmi5.oracle.json"),
    resolve(root, "examples/configs/lti13.core-launch.json"),
  ];

  for (const file of configs) {
    const parsed = RunnerConfigSchema.safeParse(readJson(file));
    expect(parsed.success).toBe(true);
  }
});

test("summary sample shape validates", () => {
  const parsed = RunnerSummarySchema.safeParse({
    contractVersion: "1.0.0",
    runner: {
      suite: "lrs",
      version: "0.1.0",
    },
    result: {
      status: "passed",
      passed: 0,
      failed: 0,
      skipped: 0,
    },
  });

  expect(parsed.success).toBe(true);
});
