import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AdapterProfileSchema } from "../src/adapter";
import { RunnerConfigSchema } from "../src/config";
import { RequirementTraceSchema, RunMetadataSchema, RunnerSummarySchema } from "../src/summary";

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
      suite: "cmi5",
      version: "0.1.0",
      profileVersion: "1.0.0",
      target: "all",
    },
    startedAt: "2026-05-24T12:00:00.000Z",
    finishedAt: "2026-05-24T12:00:01.000Z",
    durationMs: 1000,
    result: {
      status: "passed",
      passed: 0,
      failed: 0,
      skipped: 0,
    },
    artifacts: {
      summaryFile: "summary.json",
      junitFile: "junit.xml",
      requirementTraceFile: "requirement-trace.json",
      runMetadataFile: "run-metadata.json",
    },
  });

  expect(parsed.success).toBe(true);
});

test("requirement trace sample shape validates", () => {
  const parsed = RequirementTraceSchema.safeParse({
    contractVersion: "1.0.0",
    runId: "run-001",
    requirements: {
      "9.3.1.0-2": {
        status: "passed",
        evidence: ["launch statement present"],
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("run metadata sample shape validates", () => {
  const parsed = RunMetadataSchema.safeParse({
    runId: "run-001",
    startedAt: "2026-05-24T12:00:00.000Z",
    finishedAt: "2026-05-24T12:00:01.000Z",
    image: {
      reference: "ghcr.io/conform-ed/cmi5-runner:v0.1.0-rc.1",
      digest: "sha256:abc123",
      source: "https://github.com/conform-ed/conform-ed",
    },
    standards: {
      suiteSourceRevision: "catapult-lts-806c0b",
      requirementsRevision: "requirements-v1",
      profileVersion: "1.0.0",
    },
    runner: {
      version: "0.1.0",
      revision: "abcdef123456",
    },
  });

  expect(parsed.success).toBe(true);
});

test("adapter profile sample shape validates", () => {
  const root = resolve(import.meta.dir, "..", "..", "..");
  const parsed = AdapterProfileSchema.safeParse(
    readJson(resolve(root, "examples/profiles/cmi5.http.adapter-profile.json")),
  );

  expect(parsed.success).toBe(true);
});
