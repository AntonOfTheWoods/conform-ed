import { afterEach, beforeEach, expect, test } from "bun:test";
import { Buffer } from "node:buffer";

import { abandonRoute } from "../src/routes/cmi5-abandon";
import { fetchRoute } from "../src/routes/cmi5-fetch";
import { launchCreateRoute } from "../src/routes/cmi5-launch-create";
import { launchDataRoute } from "../src/routes/cmi5-launch-data";
import { packageImportRoute } from "../src/routes/cmi5-package-import";
import { resetCmi5State } from "../src/routes/cmi5-state";
import { stateReloadRoute } from "../src/routes/cmi5-state-reload";
import { getStatementsRoute, postStatementRoute } from "../src/routes/cmi5-statements";
import { waiveRoute } from "../src/routes/cmi5-waive";
import { fixturesProvisionRoute } from "../src/routes/fixtures-provision";

beforeEach(() => {
  resetCmi5State();
});

afterEach(() => {
  delete process.env["CMI5_FETCH_TOKEN_TTL_SECONDS"];
  delete process.env["CMI5_AUTH_TOKEN_TTL_SECONDS"];
  delete process.env["CMI5_STATE_FILE_PATH"];
});

const VALID_PACKAGE_BASE64 = Buffer.from(
  JSON.stringify({
    manifest: {
      identifier: "pkg.test.valid",
      title: "Test Package",
      version: "1.0.0",
    },
    aus: [
      {
        id: "au-001",
        launchUrl: "https://example.invalid/au/001",
        moveOn: "CompletedAndPassed",
      },
    ],
  }),
  "utf8",
).toString("base64");

test("fixtures provision returns stable operation envelope", async () => {
  const response = await fixturesProvisionRoute(
    new Request("http://localhost/v1/fixtures/provision", {
      method: "POST",
      body: JSON.stringify({ fixtureId: "fixture-demo" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(200);
  const body = (await response.json()) as { operation: string; fixtureId: string };
  expect(body.operation).toBe("fixtures.provision");
  expect(body.fixtureId).toBe("fixture-demo");
});

test("package import rejects invalid base64 payload", async () => {
  const response = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: "not-base64***" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("package import rejects invalid package structure payload", async () => {
  const nonJsonResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: Buffer.from("plain-package", "utf8").toString("base64") }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(nonJsonResponse.status).toBe(400);

  const missingManifestResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({
        packageBase64: Buffer.from(
          JSON.stringify({
            aus: [{ id: "au-001", launchUrl: "https://example.invalid/au/001", moveOn: "Completed" }],
          }),
          "utf8",
        ).toString("base64"),
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(missingManifestResponse.status).toBe(400);

  const invalidAuResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({
        packageBase64: Buffer.from(
          JSON.stringify({
            manifest: { identifier: "pkg-invalid", title: "Invalid Package", version: "1.0.0" },
            aus: [{ id: "au-001", launchUrl: "notaurl", moveOn: "Any" }],
          }),
          "utf8",
        ).toString("base64"),
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(invalidAuResponse.status).toBe(400);
});

test("cmi5 reference flow import -> launch -> waive -> abandon succeeds", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64 }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(packageResponse.status).toBe(200);
  const packageBody = (await packageResponse.json()) as { packageId: string };

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: packageBody.packageId, learnerId: "learner-1" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as {
    launchId: string;
    registrationId: string;
    sessionId: string;
    launchMode: string;
    moveOn: string;
    masteryScore: number;
    launchParameters: string;
    contextTemplate: {
      extensions: Record<string, unknown>;
      contextActivities: { grouping: Array<{ id: string }> };
    };
  };
  expect(launchBody.launchMode).toBe("Normal");
  expect(launchBody.moveOn).toBe("CompletedAndPassed");
  expect(launchBody.masteryScore).toBe(0.9);
  expect(launchBody.launchParameters).toContain("paramA=1");
  expect(launchBody.contextTemplate.extensions["https://w3id.org/xapi/cmi5/context/extensions/sessionid"]).toBe(
    launchBody.sessionId,
  );
  expect(launchBody.contextTemplate.contextActivities.grouping[0]?.id).toBe(
    "https://w3id.org/xapi/cmi5/catapult/lts/au/001-essentials",
  );

  const waiveResponse = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: launchBody.registrationId }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(waiveResponse.status).toBe(200);

  const abandonResponse = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({ sessionId: launchBody.sessionId }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(abandonResponse.status).toBe(200);
  const abandonBody = (await abandonResponse.json()) as { launchId: string; abandoned: boolean };
  expect(abandonBody.launchId).toBe(launchBody.launchId);
  expect(abandonBody.abandoned).toBe(true);
});

test("fetch exchanges once and launch-data requires the exchanged auth token", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-fetch-data" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-fetch-data", learnerId: "learner-fetch@example.test" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string; sessionId: string; registrationId: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(200);
  const fetchBody = (await fetchResponse.json()) as {
    "auth-token": string;
    launchDataUrl: string;
    sessionId: string;
  };
  expect(fetchBody.sessionId).toBe(launchBody.sessionId);

  const unauthorizedLaunchDataResponse = await launchDataRoute(
    new Request(fetchBody.launchDataUrl, {
      headers: { authorization: "Basic invalid" },
      method: "GET",
    }),
  );
  expect(unauthorizedLaunchDataResponse.status).toBe(401);

  const launchDataResponse = await launchDataRoute(
    new Request(fetchBody.launchDataUrl, {
      headers: { authorization: fetchBody["auth-token"] },
      method: "GET",
    }),
  );
  expect(launchDataResponse.status).toBe(200);
  const launchDataBody = (await launchDataResponse.json()) as {
    registration: string;
    launchSessionId: string;
    contextTemplate: { registration: string; extensions: Record<string, unknown> };
  };
  expect(launchDataBody.registration).toBe(launchBody.registrationId);
  expect(launchDataBody.launchSessionId).toBe(launchBody.sessionId);
  expect(launchDataBody.contextTemplate.registration).toBe(launchBody.registrationId);
  expect(launchDataBody.contextTemplate.extensions["https://w3id.org/xapi/cmi5/context/extensions/sessionid"]).toBe(
    launchBody.sessionId,
  );

  const repeatedFetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(repeatedFetchResponse.status).toBe(409);
});

test("fetch rejects expired launch token when TTL window is exceeded", async () => {
  process.env["CMI5_FETCH_TOKEN_TTL_SECONDS"] = "0";

  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-fetch-expired" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-fetch-expired" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(403);
});

test("launch-data rejects expired auth token when TTL window is exceeded", async () => {
  process.env["CMI5_AUTH_TOKEN_TTL_SECONDS"] = "0";

  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-auth-expired" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-auth-expired" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(200);
  const fetchBody = (await fetchResponse.json()) as { "auth-token": string; launchDataUrl: string };

  const launchDataResponse = await launchDataRoute(
    new Request(fetchBody.launchDataUrl, {
      method: "GET",
      headers: { authorization: fetchBody["auth-token"] },
    }),
  );
  expect(launchDataResponse.status).toBe(403);
});

test("statement and launch-data routes reject replayed x-cmi5-request-id values", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-replay" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-replay", moveOn: "NotApplicable" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string; sessionId: string; registrationId: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(200);
  const fetchBody = (await fetchResponse.json()) as { "auth-token": string; launchDataUrl: string };

  const firstLaunchDataResponse = await launchDataRoute(
    new Request(fetchBody.launchDataUrl, {
      method: "GET",
      headers: {
        authorization: fetchBody["auth-token"],
        "x-cmi5-request-id": "launch-data-replay-1",
      },
    }),
  );
  expect(firstLaunchDataResponse.status).toBe(200);

  const replayedLaunchDataResponse = await launchDataRoute(
    new Request(fetchBody.launchDataUrl, {
      method: "GET",
      headers: {
        authorization: fetchBody["auth-token"],
        "x-cmi5-request-id": "launch-data-replay-1",
      },
    }),
  );
  expect(replayedLaunchDataResponse.status).toBe(409);

  const firstStatementResponse = await postStatementRoute(
    new Request("http://localhost/v1/cmi5/xapi/statements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: fetchBody["auth-token"],
        "x-cmi5-request-id": "statement-replay-1",
      },
      body: JSON.stringify({
        sessionId: launchBody.sessionId,
        registrationId: launchBody.registrationId,
        verb: "initialized",
      }),
    }),
  );
  expect(firstStatementResponse.status).toBe(200);

  const replayedStatementResponse = await postStatementRoute(
    new Request("http://localhost/v1/cmi5/xapi/statements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: fetchBody["auth-token"],
        "x-cmi5-request-id": "statement-replay-1",
      },
      body: JSON.stringify({
        sessionId: launchBody.sessionId,
        registrationId: launchBody.registrationId,
        verb: "launched",
      }),
    }),
  );
  expect(replayedStatementResponse.status).toBe(409);
});

test("au runtime lifecycle accepts ordered statements and exposes lifecycle state", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-runtime" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-runtime", moveOn: "CompletedAndPassed" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string; sessionId: string; registrationId: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(200);
  const fetchBody = (await fetchResponse.json()) as { "auth-token": string };

  const sequence = ["initialized", "launched", "progressed", "completed", "passed", "terminated"];
  for (const verb of sequence) {
    const statementResponse = await postStatementRoute(
      new Request("http://localhost/v1/cmi5/xapi/statements", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: fetchBody["auth-token"],
        },
        body: JSON.stringify({
          sessionId: launchBody.sessionId,
          registrationId: launchBody.registrationId,
          verb,
        }),
      }),
    );

    expect(statementResponse.status).toBe(200);
  }

  const statementsResponse = await getStatementsRoute(
    new Request(`http://localhost/v1/cmi5/xapi/statements?sessionId=${encodeURIComponent(launchBody.sessionId)}`, {
      method: "GET",
      headers: {
        authorization: fetchBody["auth-token"],
      },
    }),
  );
  expect(statementsResponse.status).toBe(200);
  const statementsBody = (await statementsResponse.json()) as {
    statements: Array<{ verb: string }>;
    lifecycle: { terminated: boolean; moveOnSatisfied: boolean };
  };
  expect(statementsBody.statements.map((statement) => statement.verb)).toEqual(sequence);
  expect(statementsBody.lifecycle.terminated).toBe(true);
  expect(statementsBody.lifecycle.moveOnSatisfied).toBe(true);
});

test("au runtime lifecycle enforces moveOn gating before terminated", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-runtime-gate" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-runtime-gate", moveOn: "Passed" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { fetch: string; sessionId: string; registrationId: string };

  const fetchResponse = await fetchRoute(new Request(launchBody.fetch, { method: "POST" }));
  expect(fetchResponse.status).toBe(200);
  const fetchBody = (await fetchResponse.json()) as { "auth-token": string };

  const initializedResponse = await postStatementRoute(
    new Request("http://localhost/v1/cmi5/xapi/statements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: fetchBody["auth-token"],
      },
      body: JSON.stringify({
        sessionId: launchBody.sessionId,
        registrationId: launchBody.registrationId,
        verb: "initialized",
      }),
    }),
  );
  expect(initializedResponse.status).toBe(200);

  const launchedResponse = await postStatementRoute(
    new Request("http://localhost/v1/cmi5/xapi/statements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: fetchBody["auth-token"],
      },
      body: JSON.stringify({
        sessionId: launchBody.sessionId,
        registrationId: launchBody.registrationId,
        verb: "launched",
      }),
    }),
  );
  expect(launchedResponse.status).toBe(200);

  const terminatedResponse = await postStatementRoute(
    new Request("http://localhost/v1/cmi5/xapi/statements", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: fetchBody["auth-token"],
      },
      body: JSON.stringify({
        sessionId: launchBody.sessionId,
        registrationId: launchBody.registrationId,
        verb: "terminated",
      }),
    }),
  );

  expect(terminatedResponse.status).toBe(409);
});

test("launch create rejects unknown package id", async () => {
  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "missing-package" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(404);
});

test("launch create accepts explicit moveOn and launchMode values", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-matrix" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({
        packageId: "pkg-matrix",
        launchMode: "Browse",
        moveOn: "Completed",
        masteryScore: 0.75,
        launchParameters: "mode=browse",
      }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(launchResponse.status).toBe(200);
  const body = (await launchResponse.json()) as {
    launchUrl: string;
    launchMode: string;
    moveOn: string;
    masteryScore: number;
    launchParameters: string;
    activityId: string;
    contextTemplate: {
      contextActivities: { grouping: Array<{ id: string }> };
      extensions: Record<string, unknown>;
    };
  };
  expect(body.launchMode).toBe("Browse");
  expect(body.moveOn).toBe("Completed");
  expect(body.masteryScore).toBe(0.75);
  expect(body.launchParameters).toBe("mode=browse");
  expect(body.contextTemplate.extensions["https://w3id.org/xapi/cmi5/context/extensions/launchmode"]).toBe("Browse");
  expect(body.contextTemplate.extensions["https://w3id.org/xapi/cmi5/context/extensions/moveon"]).toBe("Completed");
  expect(body.contextTemplate.contextActivities.grouping[0]?.id).toBe(body.activityId);

  const launchUrl = new URL(body.launchUrl);
  expect(launchUrl.searchParams.get("launchMode")).toBe("Browse");
  expect(launchUrl.searchParams.get("moveOn")).toBe("Completed");
  expect(launchUrl.searchParams.get("activityId")).toBe(body.activityId);
  expect(launchUrl.searchParams.get("launchParameters")).toBe("mode=browse");
});

test("launch create preserves explicit launch identity fields", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-explicit-identity" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({
        packageId: "pkg-explicit-identity",
        launchId: "launch-explicit-001",
        registrationId: "registration-explicit-001",
        sessionId: "session-explicit-001",
        learnerId: "learner-explicit@example.test",
      }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(launchResponse.status).toBe(200);
  const body = (await launchResponse.json()) as {
    launchId: string;
    registrationId: string;
    sessionId: string;
    fetch: string;
    launchUrl: string;
    contextTemplate: {
      extensions: Record<string, unknown>;
    };
  };

  expect(body.launchId).toBe("launch-explicit-001");
  expect(body.registrationId).toBe("registration-explicit-001");
  expect(body.sessionId).toBe("session-explicit-001");
  expect(body.fetch).toContain("sessionId=session-explicit-001");
  expect(body.contextTemplate.extensions["https://w3id.org/xapi/cmi5/context/extensions/sessionid"]).toBe(
    "session-explicit-001",
  );

  const launchUrl = new URL(body.launchUrl);
  expect(launchUrl.pathname).toContain("/launch-explicit-001");
  expect(launchUrl.searchParams.get("registration")).toBe("registration-explicit-001");
  expect(launchUrl.searchParams.get("fetch")).toBe(body.fetch);
});

test("waive rejects unknown registration id", async () => {
  const response = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: "registration-missing" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(404);
});

test("waive is idempotent and launch reflects waived registration", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-waive-state" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const firstLaunchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-waive-state", registrationId: "registration-waive-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(firstLaunchResponse.status).toBe(200);

  const firstWaiveResponse = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: "registration-waive-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(firstWaiveResponse.status).toBe(200);
  const firstWaiveBody = (await firstWaiveResponse.json()) as { alreadyWaived: boolean; waivedAt: string };
  expect(firstWaiveBody.alreadyWaived).toBe(false);

  const secondWaiveResponse = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: "registration-waive-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(secondWaiveResponse.status).toBe(200);
  const secondWaiveBody = (await secondWaiveResponse.json()) as { alreadyWaived: boolean; waivedAt: string };
  expect(secondWaiveBody.alreadyWaived).toBe(true);
  expect(secondWaiveBody.waivedAt).toBe(firstWaiveBody.waivedAt);

  const resumedLaunchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-waive-state", registrationId: "registration-waive-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(resumedLaunchResponse.status).toBe(200);
  const resumedLaunchBody = (await resumedLaunchResponse.json()) as {
    waivedRegistration: boolean;
    waivedAt: string | null;
  };
  expect(resumedLaunchBody.waivedRegistration).toBe(true);
  expect(resumedLaunchBody.waivedAt).toBe(firstWaiveBody.waivedAt);
});

test("abandon returns conflict when session already abandoned and launch rejects abandoned session id", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-abandon-state" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-abandon-state" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);
  const launchBody = (await launchResponse.json()) as { sessionId: string };

  const firstAbandonResponse = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({ sessionId: launchBody.sessionId }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(firstAbandonResponse.status).toBe(200);

  const secondAbandonResponse = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({ sessionId: launchBody.sessionId }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(secondAbandonResponse.status).toBe(409);

  const launchWithAbandonedSessionResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-abandon-state", sessionId: launchBody.sessionId }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchWithAbandonedSessionResponse.status).toBe(409);
});

test("state reload restores waived and abandoned lifecycle state from durable snapshot", async () => {
  process.env["CMI5_STATE_FILE_PATH"] = `${process.cwd()}/tmp/agents/cmi5-state-reload.test.json`;

  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-durable-state" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const launchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({
        packageId: "pkg-durable-state",
        registrationId: "registration-durable-state-001",
        sessionId: "session-durable-state-001",
      }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(launchResponse.status).toBe(200);

  const waiveResponse = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: "registration-durable-state-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(waiveResponse.status).toBe(200);

  const abandonResponse = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-durable-state-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(abandonResponse.status).toBe(200);

  const reloadResponse = await stateReloadRoute(
    new Request("http://localhost/v1/cmi5/state/reload", {
      method: "POST",
      body: JSON.stringify({ reason: "test" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(reloadResponse.status).toBe(200);
  const reloadBody = (await reloadResponse.json()) as { loaded: boolean };
  expect(reloadBody.loaded).toBe(true);

  const rewaiveResponse = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({ registrationId: "registration-durable-state-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(rewaiveResponse.status).toBe(200);
  const rewaiveBody = (await rewaiveResponse.json()) as { alreadyWaived: boolean };
  expect(rewaiveBody.alreadyWaived).toBe(true);

  const relaunchResponse = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-durable-state", sessionId: "session-durable-state-001" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(relaunchResponse.status).toBe(409);
});

test("launch create rejects invalid launchMode", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-mode-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-mode-invalid", launchMode: "Sandbox" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid moveOn", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-moveon-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-moveon-invalid", moveOn: "Any" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid masteryScore", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-mastery-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-mastery-invalid", masteryScore: 1.2 }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid learnerId", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-learner-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-learner-invalid", learnerId: "" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid launchParameters", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-launch-params-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-launch-params-invalid", launchParameters: "" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid activityId", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-activity-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-activity-invalid", activityId: "" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("launch create rejects invalid entitlementKey", async () => {
  const packageResponse = await packageImportRoute(
    new Request("http://localhost/v1/cmi5/packages/import", {
      method: "POST",
      body: JSON.stringify({ packageBase64: VALID_PACKAGE_BASE64, packageId: "pkg-entitlement-invalid" }),
      headers: { "content-type": "application/json" },
    }),
  );
  expect(packageResponse.status).toBe(200);

  const response = await launchCreateRoute(
    new Request("http://localhost/v1/cmi5/launches", {
      method: "POST",
      body: JSON.stringify({ packageId: "pkg-entitlement-invalid", entitlementKey: "" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("abandon rejects unknown session id", async () => {
  const response = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({ sessionId: "session-missing" }),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(404);
});

test("waive rejects missing registration id", async () => {
  const response = await waiveRoute(
    new Request("http://localhost/v1/cmi5/registrations/waive", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});

test("abandon rejects missing session id", async () => {
  const response = await abandonRoute(
    new Request("http://localhost/v1/cmi5/sessions/abandon", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    }),
  );

  expect(response.status).toBe(400);
});
