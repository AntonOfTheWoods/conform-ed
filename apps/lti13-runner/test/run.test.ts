import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { runLti13, validateLti13Config } from "../src/run";

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env["CONFORM_ED_ADAPTER_TOKEN"];
});

async function withTempConfig(config: unknown): Promise<{ configPath: string; cleanup: () => Promise<void> }> {
  const tmpRoot = join(process.cwd(), "tmp", "agents");
  await mkdir(tmpRoot, { recursive: true });

  const dir = await mkdtemp(join(tmpRoot, "lti13-runner-"));
  const configPath = join(dir, "config.json");
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

  return {
    configPath,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

function mockFetch(handler: FetchMock): void {
  globalThis.fetch = handler as typeof globalThis.fetch;
}

function capabilitiesPayload() {
  return {
    profileVersion: "1.0.0",
    adapterName: "lti13-adapter-reference",
    adapterVersion: "0.1.0",
    profiles: ["lti13-tool-v1"],
    operations: [
      "lti.registration.resolve",
      "lti.login.initiation",
      "lti.launch.create",
      "lti.deep-link.create",
      "lti.ags.line-items",
      "lti.ags.scores",
      "lti.nrps.memberships",
    ],
  };
}

function profilePayload() {
  return {
    contractVersion: "1.0.0",
    profileVersion: "1.0.0",
    suite: "lti13",
    adapter: {
      name: "lti13-adapter-reference",
      version: "0.1.0",
      transport: "http-json",
    },
    interoperability: {
      statementRetrieval: "adapter-api",
    },
    operations: [
      {
        name: "lti.registration.resolve",
        path: "/v1/lti/registrations/resolve",
        method: "POST",
      },
      {
        name: "lti.login.initiation",
        path: "/v1/lti/login-initiation",
        method: "POST",
      },
      {
        name: "lti.launch.create",
        path: "/v1/lti/launches",
        method: "POST",
      },
      {
        name: "lti.deep-link.create",
        path: "/v1/lti/deep-links",
        method: "POST",
      },
      {
        name: "lti.ags.line-items",
        path: "/v1/lti/ags/line-items",
        method: "POST",
      },
      {
        name: "lti.ags.scores",
        path: "/v1/lti/ags/scores",
        method: "POST",
      },
      {
        name: "lti.nrps.memberships",
        path: "/v1/lti/nrps/memberships",
        method: "GET",
      },
    ],
    artifacts: {
      requirementTraceRequired: true,
    },
  };
}

function baseConfig() {
  return {
    suite: { name: "lti13", target: "core-launch" },
    sut: { publicUrls: { tool: "http://127.0.0.1:4401" } },
    artifacts: { outputDir: "/artifacts" },
    adapter: {
      kind: "http",
      baseUrl: "http://127.0.0.1:4600",
      auth: { mode: "bearer", tokenFromEnv: "CONFORM_ED_ADAPTER_TOKEN" },
    },
  };
}

test("runLti13 returns error when bearer token env var is unset", async () => {
  const fixture = await withTempConfig(baseConfig());

  const result = await runLti13(fixture.configPath);
  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.code).toBe("run_preflight_failed");
  }

  await fixture.cleanup();
});

test("runLti13 returns execution_passed when capabilities, profile, and operations are compatible", async () => {
  process.env["CONFORM_ED_ADAPTER_TOKEN"] = "token-123";
  const fixture = await withTempConfig(baseConfig());

  mockFetch(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json(capabilitiesPayload());
    }

    if (url.endsWith("/v1/profile")) {
      return Response.json(profilePayload());
    }

    return Response.json({ ok: true });
  });

  const result = await runLti13(fixture.configPath);
  expect(result.status).toBe("execution_passed");
  if (result.status === "execution_passed") {
    expect(result.execution).toBe("matrix_passed");
    expect(result.checks.length).toBe(3);
  }

  await fixture.cleanup();
});

test("runLti13 returns lti_operation_failed when an operation endpoint fails", async () => {
  process.env["CONFORM_ED_ADAPTER_TOKEN"] = "token-123";
  const fixture = await withTempConfig(baseConfig());

  mockFetch(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json(capabilitiesPayload());
    }

    if (url.endsWith("/v1/profile")) {
      return Response.json(profilePayload());
    }

    if (url.endsWith("/v1/lti/login-initiation")) {
      return Response.json({ error: "boom" }, { status: 502 });
    }

    return Response.json({ ok: true });
  });

  const result = await runLti13(fixture.configPath);
  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.code).toBe("lti_operation_failed");
  }

  await fixture.cleanup();
});

test("runLti13 returns error when capabilities are missing required operation", async () => {
  process.env["CONFORM_ED_ADAPTER_TOKEN"] = "token-123";
  const fixture = await withTempConfig(baseConfig());

  mockFetch(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json({
        ...capabilitiesPayload(),
        operations: ["lti.registration.resolve", "lti.login.initiation"],
      });
    }

    return Response.json(profilePayload());
  });

  const result = await runLti13(fixture.configPath);
  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.code).toBe("adapter_operations_missing");
  }

  await fixture.cleanup();
});

test("validateLti13Config returns valid true when matrix execution passes", async () => {
  process.env["CONFORM_ED_ADAPTER_TOKEN"] = "token-123";
  const fixture = await withTempConfig(baseConfig());

  mockFetch(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json(capabilitiesPayload());
    }

    if (url.endsWith("/v1/profile")) {
      return Response.json(profilePayload());
    }

    return Response.json({ ok: true });
  });

  const result = await validateLti13Config(fixture.configPath);
  expect(result.valid).toBe(true);

  await fixture.cleanup();
});

test("validateLti13Config returns valid false when compatibility checks fail", async () => {
  process.env["CONFORM_ED_ADAPTER_TOKEN"] = "token-123";
  const fixture = await withTempConfig(baseConfig());

  mockFetch(async () =>
    Response.json(
      {
        error: { code: "upstream_unavailable" },
      },
      { status: 503 },
    ),
  );

  const result = await validateLti13Config(fixture.configPath);
  expect(result.valid).toBe(false);
  if (!result.valid) {
    expect(result.code).toBe("adapter_capabilities_fetch_failed");
  }

  await fixture.cleanup();
});
