import { expect, test } from "bun:test";
import { AdapterCapabilitySchema, AdapterErrorSchema, AdapterProfileSchema } from "../src/adapter";
import { RunnerConfigSchema } from "../src/config";

test("RunnerConfigSchema parses minimal config", () => {
  const parsed = RunnerConfigSchema.parse({
    suite: { name: "lrs", target: "all" },
    sut: { publicUrls: { lrs: "http://127.0.0.1:4001/xapi" } },
    artifacts: { outputDir: "/artifacts" },
  });

  expect(parsed.contractVersion).toBe("1.0.0");
});

test("RunnerConfigSchema requires adapter for cmi5 suite", () => {
  const parsed = RunnerConfigSchema.safeParse({
    suite: { name: "cmi5", target: "all" },
    sut: { publicUrls: { api: "http://127.0.0.1:4301" } },
    artifacts: { outputDir: "/artifacts" },
  });

  expect(parsed.success).toBe(false);
});

test("RunnerConfigSchema enforces bearer adapter token source", () => {
  const parsed = RunnerConfigSchema.safeParse({
    suite: { name: "cmi5", target: "all" },
    sut: { publicUrls: { api: "http://127.0.0.1:4301" } },
    artifacts: { outputDir: "/artifacts" },
    adapter: {
      kind: "http",
      baseUrl: "http://127.0.0.1:4500",
      auth: { mode: "bearer" },
    },
  });

  expect(parsed.success).toBe(false);
});

test("AdapterCapabilitySchema validates profile payload", () => {
  const parsed = AdapterCapabilitySchema.safeParse({
    profileVersion: "1.0.0",
    adapterName: "emergent-adapter",
    adapterVersion: "0.1.0",
    profiles: ["cmi5-http-v1"],
    operations: ["package.import", "launch.create", "statements.list"],
  });

  expect(parsed.success).toBe(true);
});

test("AdapterProfileSchema validates cmi5 interoperability contract", () => {
  const parsed = AdapterProfileSchema.safeParse({
    contractVersion: "1.0.0",
    profileVersion: "1.0.0",
    suite: "cmi5",
    adapter: {
      name: "cmi5-adapter-reference",
      version: "0.1.0",
      transport: "http-json",
    },
    interoperability: {
      statementRetrieval: "adapter-api",
      packageUpload: "inline-base64",
    },
    operations: [
      {
        name: "package.upload.inline-base64",
        path: "/v1/cmi5/packages",
        method: "POST",
      },
      {
        name: "statements.list",
        path: "/v1/cmi5/statements",
        method: "GET",
      },
    ],
    artifacts: {
      requirementTraceRequired: true,
    },
  });

  expect(parsed.success).toBe(true);
});

test("AdapterProfileSchema requires cmi5 packageUpload", () => {
  const parsed = AdapterProfileSchema.safeParse({
    contractVersion: "1.0.0",
    profileVersion: "1.0.0",
    suite: "cmi5",
    adapter: {
      name: "cmi5-adapter-reference",
      version: "0.1.0",
      transport: "http-json",
    },
    interoperability: {
      statementRetrieval: "adapter-api",
    },
    operations: [
      {
        name: "statements.list",
        path: "/v1/cmi5/statements",
        method: "GET",
      },
    ],
    artifacts: {
      requirementTraceRequired: true,
    },
  });

  expect(parsed.success).toBe(false);
});

test("AdapterErrorSchema validates uniform error envelope", () => {
  const parsed = AdapterErrorSchema.safeParse({
    error: {
      code: "upstream_unavailable",
      message: "Temporary upstream outage",
      category: "upstream_unavailable",
      retriable: true,
    },
  });

  expect(parsed.success).toBe(true);
});
