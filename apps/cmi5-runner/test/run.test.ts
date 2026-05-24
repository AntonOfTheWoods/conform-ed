import { Buffer } from "node:buffer";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { runCmi5, validateCmi5Config } from "../src/run";

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.CONFORM_ED_ADAPTER_TOKEN;
});

async function withTempConfig(config: unknown): Promise<{ configPath: string; cleanup: () => Promise<void> }> {
  const tmpRoot = join(process.cwd(), "tmp", "agents");
  await mkdir(tmpRoot, { recursive: true });

  const dir = await mkdtemp(join(tmpRoot, "cmi5-runner-"));
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

function parseJsonBody(init?: RequestInit): Record<string, unknown> {
  if (!init || typeof init.body !== "string") {
    return {};
  }

  const parsed = JSON.parse(init.body) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed as Record<string, unknown>;
}

function baseConfig(outputDir: string): Record<string, unknown> {
  return {
    suite: { name: "cmi5", target: "all" },
    sut: { publicUrls: { api: "http://127.0.0.1:4301" } },
    artifacts: { outputDir },
    adapter: {
      kind: "http",
      baseUrl: "http://127.0.0.1:4500",
      auth: { mode: "bearer", tokenFromEnv: "CONFORM_ED_ADAPTER_TOKEN" },
    },
  };
}

async function withRunnerFixture(): Promise<{ configPath: string; outputDir: string; cleanup: () => Promise<void> }> {
  const tmpRoot = join(process.cwd(), "tmp", "agents");
  await mkdir(tmpRoot, { recursive: true });

  const fixtureDir = await mkdtemp(join(tmpRoot, "cmi5-runner-output-"));
  const outputDir = join(fixtureDir, "artifacts");
  const configFixture = await withTempConfig(baseConfig(outputDir));

  return {
    configPath: configFixture.configPath,
    outputDir,
    cleanup: async () => {
      await configFixture.cleanup();
      await rm(fixtureDir, { recursive: true, force: true });
    },
  };
}

function mockCompatibleAdapter(): void {
  let launchCounter = 0;
  const registrations = new Set<string>();
  const waivedRegistrations = new Map<string, string>();
  const abandonedSessions = new Set<string>();
  const launchSessions = new Map<
    string,
    {
      activityId: string;
      entitlementKey: string;
      launchId: string;
      launchMode: string;
      launchParameters: string;
      learnerId: string;
      masteryScore: number;
      moveOn: string;
      registrationId: string;
      sessionId: string;
    }
  >();
  const consumedFetchTokens = new Set<string>();
  const sessionStatements = new Map<string, string[]>();
  const replayRequestIdsBySession = new Map<string, Set<string>>();

  function readAuthorizationHeader(init?: RequestInit): string | null {
    if (init?.headers instanceof Headers) {
      return init.headers.get("authorization");
    }
    if (init?.headers && "authorization" in init.headers) {
      return String(init.headers.authorization);
    }
    return null;
  }

  function moveOnSatisfied(moveOn: string, statements: string[]): boolean {
    const completed = statements.includes("completed");
    const passed = statements.includes("passed");

    switch (moveOn) {
      case "Passed":
        return passed;
      case "Completed":
        return completed;
      case "CompletedAndPassed":
        return completed && passed;
      case "CompletedOrPassed":
        return completed || passed;
      case "NotApplicable":
        return true;
      default:
        return false;
    }
  }

  mockFetch(async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json({
        profileVersion: "1.0.0",
        adapterName: "cmi5-adapter-reference",
        adapterVersion: "0.1.0",
        profiles: ["cmi5-lms-v1"],
        operations: [
          "fixtures.provision",
          "cmi5.package.import",
          "cmi5.launch.create",
          "cmi5.launch.fetch",
          "cmi5.launch.data",
          "cmi5.au.statement.post",
          "cmi5.au.statement.get",
          "cmi5.registration.waive",
          "cmi5.session.abandon",
          "cmi5.state.reload",
        ],
        optionalFeatures: [
          "cmi5-fetch-auth-exchange",
          "cmi5-launch-data-resource",
          "cmi5-au-runtime-lifecycle",
          "cmi5-fetch-auth-hardening",
          "cmi5-auth-request-replay-protection",
          "cmi5-package-structure-validation",
          "cmi5-durable-state",
          "cmi5-cross-system-integration",
        ],
      });
    }

    if (url.endsWith("/v1/profile")) {
      return Response.json({
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
            name: "fixtures.provision",
            path: "/v1/fixtures/provision",
            method: "POST",
          },
          {
            name: "cmi5.package.import",
            path: "/v1/cmi5/packages/import",
            method: "POST",
          },
          {
            name: "cmi5.launch.create",
            path: "/v1/cmi5/launches",
            method: "POST",
          },
          {
            name: "cmi5.launch.fetch",
            path: "/v1/cmi5/launch/fetch",
            method: "POST",
          },
          {
            name: "cmi5.launch.data",
            path: "/v1/cmi5/launch-data",
            method: "GET",
          },
          {
            name: "cmi5.au.statement.post",
            path: "/v1/cmi5/xapi/statements",
            method: "POST",
          },
          {
            name: "cmi5.au.statement.get",
            path: "/v1/cmi5/xapi/statements",
            method: "GET",
          },
          {
            name: "cmi5.registration.waive",
            path: "/v1/cmi5/registrations/waive",
            method: "POST",
          },
          {
            name: "cmi5.session.abandon",
            path: "/v1/cmi5/sessions/abandon",
            method: "POST",
          },
          {
            name: "cmi5.state.reload",
            path: "/v1/cmi5/state/reload",
            method: "POST",
          },
        ],
        artifacts: {
          requirementTraceRequired: true,
        },
      });
    }

    if (url.endsWith("/v1/fixtures/provision")) {
      return Response.json({ status: "ok" });
    }

    if (url.endsWith("/v1/cmi5/packages/import")) {
      const body = parseJsonBody(init);
      if (body.packageBase64 === "not-base64") {
        return Response.json({ error: { code: "invalid_package" } }, { status: 400 });
      }

      if (typeof body.packageBase64 !== "string") {
        return Response.json({ error: { code: "invalid_package" } }, { status: 400 });
      }

      let decodedPackage: unknown;
      try {
        decodedPackage = JSON.parse(Buffer.from(body.packageBase64, "base64").toString("utf8"));
      } catch {
        return Response.json({ error: { code: "invalid_package_structure" } }, { status: 400 });
      }

      const packageObject =
        decodedPackage && typeof decodedPackage === "object" && !Array.isArray(decodedPackage)
          ? (decodedPackage as Record<string, unknown>)
          : null;
      const manifestObject =
        packageObject?.manifest && typeof packageObject.manifest === "object" && !Array.isArray(packageObject.manifest)
          ? (packageObject.manifest as Record<string, unknown>)
          : null;
      const ausValue = packageObject?.aus;

      const manifestValid =
        manifestObject &&
        typeof manifestObject.identifier === "string" &&
        manifestObject.identifier.length > 0 &&
        typeof manifestObject.title === "string" &&
        manifestObject.title.length > 0 &&
        typeof manifestObject.version === "string" &&
        manifestObject.version.length > 0;

      const ausValid =
        Array.isArray(ausValue) &&
        ausValue.length > 0 &&
        ausValue.every((au) => {
          if (!au || typeof au !== "object" || Array.isArray(au)) {
            return false;
          }

          const auRecord = au as Record<string, unknown>;
          if (
            typeof auRecord.id !== "string" ||
            typeof auRecord.launchUrl !== "string" ||
            !["Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed", "NotApplicable"].includes(
              String(auRecord.moveOn),
            )
          ) {
            return false;
          }

          try {
            const parsedLaunchUrl = new URL(auRecord.launchUrl);
            return parsedLaunchUrl.protocol.startsWith("http");
          } catch {
            return false;
          }
        });

      if (!manifestValid || !ausValid) {
        return Response.json({ error: { code: "invalid_package_structure" } }, { status: 400 });
      }

      return Response.json({
        status: "ok",
        packageId: body.packageId ?? "pkg-1",
      });
    }

    if (url.endsWith("/v1/cmi5/launches")) {
      launchCounter += 1;
      const body = parseJsonBody(init);
      const packageId = typeof body.packageId === "string" ? body.packageId : null;
      if (!packageId) {
        return Response.json({ error: { code: "missing_package_id" } }, { status: 400 });
      }
      if (packageId === "missing-package") {
        return Response.json({ error: { code: "package_not_found" } }, { status: 404 });
      }

      if (typeof body.launchMode === "string" && !["Normal", "Browse", "Review"].includes(body.launchMode)) {
        return Response.json({ error: { code: "invalid_launch_mode" } }, { status: 400 });
      }
      if (
        typeof body.moveOn === "string" &&
        !["Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed", "NotApplicable"].includes(body.moveOn)
      ) {
        return Response.json({ error: { code: "invalid_move_on" } }, { status: 400 });
      }
      if (typeof body.masteryScore === "number" && (body.masteryScore < 0 || body.masteryScore > 1)) {
        return Response.json({ error: { code: "invalid_mastery_score" } }, { status: 400 });
      }
      if (Object.hasOwn(body, "learnerId") && (typeof body.learnerId !== "string" || body.learnerId.length === 0)) {
        return Response.json({ error: { code: "invalid_learner_id" } }, { status: 400 });
      }
      if (
        Object.hasOwn(body, "launchParameters") &&
        (typeof body.launchParameters !== "string" || body.launchParameters.length === 0)
      ) {
        return Response.json({ error: { code: "invalid_launch_parameters" } }, { status: 400 });
      }
      if (Object.hasOwn(body, "activityId") && (typeof body.activityId !== "string" || body.activityId.length === 0)) {
        return Response.json({ error: { code: "invalid_activity_id" } }, { status: 400 });
      }
      if (
        Object.hasOwn(body, "entitlementKey") &&
        (typeof body.entitlementKey !== "string" || body.entitlementKey.length === 0)
      ) {
        return Response.json({ error: { code: "invalid_entitlement_key" } }, { status: 400 });
      }

      const launchId = typeof body.launchId === "string" ? body.launchId : `launch-${launchCounter}`;
      const registrationId = typeof body.registrationId === "string" ? body.registrationId : "reg-1";
      const learnerId = typeof body.learnerId === "string" ? body.learnerId : "learner@emergent.test";
      const launchMode = typeof body.launchMode === "string" ? body.launchMode : "Normal";
      const moveOn = typeof body.moveOn === "string" ? body.moveOn : "CompletedAndPassed";
      const masteryScore = typeof body.masteryScore === "number" ? body.masteryScore : 0.9;
      const launchParameters = typeof body.launchParameters === "string" ? body.launchParameters : "paramA=1&paramB=2";
      const activityId =
        typeof body.activityId === "string"
          ? body.activityId
          : "https://w3id.org/xapi/cmi5/catapult/lts/au/001-essentials";
      const entitlementKey = typeof body.entitlementKey === "string" ? body.entitlementKey : `entitlement-${learnerId}`;
      const sessionId = typeof body.sessionId === "string" ? body.sessionId : `session-${launchCounter}`;

      if (abandonedSessions.has(sessionId)) {
        return Response.json({ error: { code: "session_abandoned" } }, { status: 409 });
      }

      registrations.add(registrationId);

      const waivedAt = waivedRegistrations.get(registrationId) ?? null;
      const endpoint = "https://example.invalid/xapi";
      const fetchToken = `fetch-${sessionId}`;
      const fetch = `http://127.0.0.1:4500/v1/cmi5/launch/fetch?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(fetchToken)}`;
      const launchUrl = `https://example.invalid/cmi5/${launchId}?fetch=${encodeURIComponent(fetch)}&registration=${encodeURIComponent(registrationId)}&actor=${encodeURIComponent(learnerId)}&activityId=${encodeURIComponent(activityId)}&endpoint=${encodeURIComponent(endpoint)}&launchMode=${encodeURIComponent(launchMode)}&moveOn=${encodeURIComponent(moveOn)}&masteryScore=${encodeURIComponent(String(masteryScore))}&launchParameters=${encodeURIComponent(launchParameters)}`;

      launchSessions.set(sessionId, {
        activityId,
        entitlementKey,
        launchId,
        launchMode,
        launchParameters,
        learnerId,
        masteryScore,
        moveOn,
        registrationId,
        sessionId,
      });
      sessionStatements.set(sessionId, []);
      replayRequestIdsBySession.set(sessionId, new Set<string>());

      return Response.json({
        status: "ok",
        launchId,
        registrationId,
        sessionId,
        learnerId,
        launchUrl,
        endpoint,
        fetch,
        launchMode,
        moveOn,
        masteryScore,
        launchParameters,
        activityId,
        entitlementKey,
        waivedRegistration: waivedAt !== null,
        waivedAt,
        actor: {
          account: {
            homePage: "https://w3id.org/xapi/cmi5/catapult/lts",
            name: learnerId,
          },
        },
        contextTemplate: {
          contextActivities: {
            grouping: [{ id: activityId }],
          },
          extensions: {
            "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionId,
            "https://w3id.org/xapi/cmi5/context/extensions/launchmode": launchMode,
            "https://w3id.org/xapi/cmi5/context/extensions/moveon": moveOn,
            "https://w3id.org/xapi/cmi5/context/extensions/launchparameters": launchParameters,
            "https://w3id.org/xapi/cmi5/context/extensions/masteryscore": masteryScore,
          },
        },
      });
    }

    if (url.startsWith("http://127.0.0.1:4500/v1/cmi5/launch/fetch")) {
      const parsedUrl = new URL(url);
      const sessionId = parsedUrl.searchParams.get("sessionId") ?? "";
      const token = parsedUrl.searchParams.get("token") ?? "";
      const launchSession = launchSessions.get(sessionId);

      if (sessionId.length === 0 || token.length === 0) {
        return Response.json({ error: { code: "missing_fetch_parameters" } }, { status: 400 });
      }

      if (!launchSession || token !== `fetch-${sessionId}`) {
        return Response.json({ error: { code: "launch_fetch_not_found" } }, { status: 404 });
      }
      if (consumedFetchTokens.has(token)) {
        return Response.json({ error: { code: "launch_fetch_consumed" } }, { status: 409 });
      }

      consumedFetchTokens.add(token);
      return Response.json({
        status: "ok",
        operation: "cmi5.launch.fetch",
        sessionId,
        launchDataUrl: `http://127.0.0.1:4500/v1/cmi5/launch-data?sessionId=${encodeURIComponent(sessionId)}`,
        "auth-token": `Basic ${Buffer.from(`launch:${sessionId}`).toString("base64")}`,
      });
    }

    if (url.startsWith("http://127.0.0.1:4500/v1/cmi5/launch-data")) {
      const parsedUrl = new URL(url);
      const sessionId = parsedUrl.searchParams.get("sessionId") ?? "";
      const launchSession = launchSessions.get(sessionId);
      const authorizationHeader = readAuthorizationHeader(init);

      if (!launchSession) {
        return Response.json({ error: { code: "session_not_found" } }, { status: 404 });
      }
      if (authorizationHeader !== `Basic ${Buffer.from(`launch:${sessionId}`).toString("base64")}`) {
        return Response.json({ error: { code: "invalid_auth_token" } }, { status: 401 });
      }

      const waivedAt = waivedRegistrations.get(launchSession.registrationId) ?? null;
      return Response.json({
        status: "ok",
        operation: "cmi5.launch.data",
        launchId: launchSession.launchId,
        launchSessionId: launchSession.sessionId,
        registration: launchSession.registrationId,
        launchMode: launchSession.launchMode,
        moveOn: launchSession.moveOn,
        masteryScore: launchSession.masteryScore,
        launchParameters: launchSession.launchParameters,
        activityId: launchSession.activityId,
        entitlementKey: launchSession.entitlementKey,
        waivedRegistration: waivedAt !== null,
        waivedAt,
        contextTemplate: {
          registration: launchSession.registrationId,
          contextActivities: {
            grouping: [{ id: launchSession.activityId }],
          },
          extensions: {
            "https://w3id.org/xapi/cmi5/context/extensions/sessionid": launchSession.sessionId,
            "https://w3id.org/xapi/cmi5/context/extensions/launchmode": launchSession.launchMode,
            "https://w3id.org/xapi/cmi5/context/extensions/moveon": launchSession.moveOn,
            "https://w3id.org/xapi/cmi5/context/extensions/launchparameters": launchSession.launchParameters,
            "https://w3id.org/xapi/cmi5/context/extensions/masteryscore": launchSession.masteryScore,
          },
        },
      });
    }

    if (url.startsWith("http://127.0.0.1:4500/v1/cmi5/xapi/statements")) {
      const parsedUrl = new URL(url);
      const authorizationHeader = readAuthorizationHeader(init);

      if (init?.method === "GET") {
        const sessionId = parsedUrl.searchParams.get("sessionId") ?? "";
        const launchSession = launchSessions.get(sessionId);
        if (!launchSession) {
          return Response.json({ error: { code: "session_not_found" } }, { status: 404 });
        }
        if (authorizationHeader !== `Basic ${Buffer.from(`launch:${sessionId}`).toString("base64")}`) {
          return Response.json({ error: { code: "invalid_auth_token" } }, { status: 401 });
        }

        const statements = sessionStatements.get(sessionId) ?? [];
        return Response.json({
          status: "ok",
          operation: "cmi5.au.statement.get",
          sessionId,
          registrationId: launchSession.registrationId,
          moveOn: launchSession.moveOn,
          statements: statements.map((verb, index) => ({
            statementId: `stmt-${sessionId}-${index + 1}`,
            verb,
            sequence: index + 1,
          })),
          lifecycle: {
            completed: statements.includes("completed"),
            failed: statements.includes("failed"),
            launched: statements.includes("launched"),
            moveOnSatisfied: moveOnSatisfied(launchSession.moveOn, statements),
            passed: statements.includes("passed"),
            progressed: statements.includes("progressed"),
            terminated: statements.includes("terminated"),
          },
        });
      }

      const body = parseJsonBody(init);
      const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
      const registrationId = typeof body.registrationId === "string" ? body.registrationId : "";
      const verb = typeof body.verb === "string" ? body.verb : "";
      const requestId =
        init?.headers instanceof Headers
          ? init.headers.get("x-cmi5-request-id")
          : init?.headers && "x-cmi5-request-id" in init.headers
            ? String(init.headers["x-cmi5-request-id"])
            : null;
      const launchSession = launchSessions.get(sessionId);
      if (!launchSession) {
        return Response.json({ error: { code: "session_not_found" } }, { status: 404 });
      }
      if (authorizationHeader !== `Basic ${Buffer.from(`launch:${sessionId}`).toString("base64")}`) {
        return Response.json({ error: { code: "invalid_auth_token" } }, { status: 401 });
      }
      if (registrationId !== launchSession.registrationId) {
        return Response.json({ error: { code: "registration_mismatch" } }, { status: 409 });
      }

      if (requestId && requestId.length > 0) {
        const requestIds = replayRequestIdsBySession.get(sessionId) ?? new Set<string>();
        if (requestIds.has(requestId)) {
          return Response.json({ error: { code: "replay_detected" } }, { status: 409 });
        }
        requestIds.add(requestId);
        replayRequestIdsBySession.set(sessionId, requestIds);
      }

      const statements = sessionStatements.get(sessionId) ?? [];
      const initialized = statements.includes("initialized");
      const launched = statements.includes("launched");
      const completed = statements.includes("completed");
      const passed = statements.includes("passed");
      const failed = statements.includes("failed");
      const terminated = statements.includes("terminated");

      if (terminated) {
        return Response.json({ error: { code: "session_terminated" } }, { status: 409 });
      }
      if (verb === "initialized" && statements.length > 0) {
        return Response.json({ error: { code: "statement_sequence_violation" } }, { status: 409 });
      }
      if (verb === "launched" && (!initialized || launched)) {
        return Response.json({ error: { code: "statement_sequence_violation" } }, { status: 409 });
      }
      if (verb === "progressed" && (!launched || completed)) {
        return Response.json({ error: { code: "statement_sequence_violation" } }, { status: 409 });
      }
      if (verb === "completed" && (!launched || completed)) {
        return Response.json({ error: { code: "statement_sequence_violation" } }, { status: 409 });
      }
      if (verb === "passed" && (!completed || passed || failed || launchSession.moveOn === "NotApplicable")) {
        return Response.json({ error: { code: "statement_sequence_violation" } }, { status: 409 });
      }
      if (verb === "failed" && (!completed || passed || failed || launchSession.moveOn !== "Completed")) {
        return Response.json({ error: { code: "move_on_violation" } }, { status: 409 });
      }
      if (verb === "terminated" && (!launched || !moveOnSatisfied(launchSession.moveOn, statements))) {
        return Response.json({ error: { code: "move_on_not_satisfied" } }, { status: 409 });
      }

      if (!["initialized", "launched", "progressed", "completed", "passed", "failed", "terminated"].includes(verb)) {
        return Response.json({ error: { code: "invalid_statement_verb" } }, { status: 400 });
      }

      const nextStatements = [...statements, verb];
      sessionStatements.set(sessionId, nextStatements);
      return Response.json({
        status: "ok",
        operation: "cmi5.au.statement.post",
        sessionId,
        registrationId,
        verb,
        sequence: nextStatements.length,
      });
    }

    if (url.endsWith("/v1/cmi5/registrations/waive")) {
      const body = parseJsonBody(init);
      if (typeof body.registrationId !== "string" || body.registrationId.length === 0) {
        return Response.json({ error: { code: "missing_registration_id" } }, { status: 400 });
      }
      if (!registrations.has(body.registrationId)) {
        return Response.json({ error: { code: "registration_not_found" } }, { status: 404 });
      }
      const alreadyWaived = waivedRegistrations.has(body.registrationId);
      const waivedAt = waivedRegistrations.get(body.registrationId) ?? "2026-01-01T00:00:00.000Z";
      waivedRegistrations.set(body.registrationId, waivedAt);
      return Response.json({ status: "ok", waived: true, alreadyWaived, waivedAt });
    }

    if (url.endsWith("/v1/cmi5/sessions/abandon")) {
      const body = parseJsonBody(init);
      if (typeof body.sessionId !== "string" || body.sessionId.length === 0) {
        return Response.json({ error: { code: "missing_session_id" } }, { status: 400 });
      }
      if (body.sessionId === "missing-session") {
        return Response.json({ error: { code: "session_not_found" } }, { status: 404 });
      }
      if (abandonedSessions.has(body.sessionId)) {
        return Response.json({ error: { code: "session_already_abandoned" } }, { status: 409 });
      }
      abandonedSessions.add(body.sessionId);
      return Response.json({ status: "ok", abandoned: true });
    }

    if (url.endsWith("/v1/cmi5/state/reload")) {
      return Response.json({ status: "ok", loaded: true });
    }

    return Response.json({ error: { code: "not_found" } }, { status: 404 });
  });
}

test("runCmi5 returns error when bearer token env var is unset", async () => {
  const fixture = await withRunnerFixture();

  const result = await runCmi5(fixture.configPath);

  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.code).toBe("run_preflight_failed");
  }

  await fixture.cleanup();
});

test("runCmi5 executes the LTS flow and writes artifacts when adapter is compatible", async () => {
  process.env.CONFORM_ED_ADAPTER_TOKEN = "token-123";

  const fixture = await withRunnerFixture();
  mockCompatibleAdapter();

  const result = await runCmi5(fixture.configPath);
  expect(result.status).toBe("completed");
  if (result.status === "completed") {
    expect(result.execution).toBe("executed");
    expect(result.result.status).toBe("passed");

    const summary = JSON.parse(await readFile(result.artifacts.summaryFile, "utf8")) as {
      result: { status: string };
    };
    expect(summary.result.status).toBe("passed");

    const requirementTrace = JSON.parse(await readFile(result.artifacts.requirementTraceFile, "utf8")) as {
      requirements: Record<string, { status: string }>;
    };
    const catapultParity = JSON.parse(await readFile(result.artifacts.catapultParityFile, "utf8")) as {
      entries: Array<{ requirementId: string; status: string; catapultTarget: string }>;
    };
    expect(requirementTrace.requirements["lts-invalid-package-rejection"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-package-structure-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-launch-data-contract"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-actor-entitlement-contract"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-launch-url-query-contract"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-fetch-launch-data-contract"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-fetch-auth-security-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-au-runtime-lifecycle-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-identity-override-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-launch-identity-passthrough"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-moveon-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-launch-mode-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-context-template-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-invalid-launch-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-resume-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-lifecycle-state-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-durable-state-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-cross-system-integration-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-invalid-operation-matrix"]?.status).toBe("passed");
    expect(requirementTrace.requirements["lts-session-abandon"]?.status).toBe("passed");
    expect(
      catapultParity.entries.some((entry) => entry.requirementId === "lts-au-runtime-lifecycle-matrix"),
    ).toBeTrue();
    expect(
      catapultParity.entries.some(
        (entry) => entry.requirementId === "lts-package-structure-matrix" && entry.catapultTarget === "package",
      ),
    ).toBeTrue();
  }

  await fixture.cleanup();
});

test("runCmi5 returns error when capabilities are missing required operation", async () => {
  process.env.CONFORM_ED_ADAPTER_TOKEN = "token-123";

  const fixture = await withRunnerFixture();

  mockFetch(async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/v1/capabilities")) {
      return Response.json({
        profileVersion: "1.0.0",
        adapterName: "cmi5-adapter-reference",
        adapterVersion: "0.1.0",
        profiles: ["cmi5-lms-v1"],
        operations: ["fixtures.provision", "cmi5.package.import"],
      });
    }

    return Response.json({
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
          name: "fixtures.provision",
          path: "/v1/fixtures/provision",
          method: "POST",
        },
        {
          name: "cmi5.package.import",
          path: "/v1/cmi5/packages/import",
          method: "POST",
        },
        {
          name: "cmi5.launch.create",
          path: "/v1/cmi5/launches",
          method: "POST",
        },
        {
          name: "cmi5.registration.waive",
          path: "/v1/cmi5/registrations/waive",
          method: "POST",
        },
        {
          name: "cmi5.session.abandon",
          path: "/v1/cmi5/sessions/abandon",
          method: "POST",
        },
      ],
      artifacts: {
        requirementTraceRequired: true,
      },
    });
  });

  const result = await runCmi5(fixture.configPath);
  expect(result.status).toBe("error");
  if (result.status === "error") {
    expect(result.code).toBe("adapter_operations_missing");
  }

  await fixture.cleanup();
});

test("validateCmi5Config returns valid true when preflight passes", async () => {
  process.env.CONFORM_ED_ADAPTER_TOKEN = "token-123";

  const fixture = await withRunnerFixture();
  mockCompatibleAdapter();

  const result = await validateCmi5Config(fixture.configPath);
  expect(result.valid).toBe(true);

  await fixture.cleanup();
});

test("validateCmi5Config returns valid false when compatibility checks fail", async () => {
  process.env.CONFORM_ED_ADAPTER_TOKEN = "token-123";

  const fixture = await withRunnerFixture();

  mockFetch(async () =>
    Response.json(
      {
        error: { code: "upstream_unavailable" },
      },
      { status: 503 },
    ),
  );

  const result = await validateCmi5Config(fixture.configPath);
  expect(result.valid).toBe(false);
  if (!result.valid) {
    expect(result.code).toBe("adapter_capabilities_fetch_failed");
  }

  await fixture.cleanup();
});
