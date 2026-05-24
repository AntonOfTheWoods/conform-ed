import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  AdapterCapabilitySchema,
  AdapterProfileSchema,
  RequirementTraceSchema,
  RunMetadataSchema,
  RunnerConfigSchema,
  RunnerSummarySchema,
} from "@conform-ed/contracts";
import { fetchAdapterCapabilities, fetchAdapterProfile } from "./adapter-client";
import { cmi5RunnerVersion } from "./version";

const requiredCmi5Operations = [
  "fixtures.provision",
  "cmi5.package.import",
  "cmi5.launch.create",
  "cmi5.registration.waive",
  "cmi5.session.abandon",
] as const;

type RunCmi5Success = {
  status: "completed";
  execution: "executed";
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result: {
    status: "passed" | "failed";
    passed: number;
    failed: number;
    skipped: number;
  };
  artifacts: {
    outputDir: string;
    summaryFile: string;
    junitFile: string;
    requirementTraceFile: string;
    runMetadataFile: string;
    catapultParityFile: string;
  };
  adapter: {
    baseUrl: string;
    adapterName: string;
    adapterVersion: string;
    profileVersion: string;
  };
};

type RunCmi5Failure = {
  status: "error";
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type RunCmi5Result = RunCmi5Success | RunCmi5Failure;

export type ValidateCmi5ConfigResult =
  | {
      valid: true;
      code: "ok";
      adapter: {
        baseUrl: string;
        adapterName: string;
        adapterVersion: string;
        profileVersion: string;
      };
    }
  | {
      valid: false;
      code: RunCmi5Failure["code"];
      message: string;
      details?: Record<string, unknown>;
    };

async function readConfig(configPath: string): Promise<unknown> {
  const payload = await readFile(resolve(process.cwd(), configPath), "utf8");
  return JSON.parse(payload);
}

type Cmi5PreflightSuccess = {
  status: "preflight_passed";
  config: ReturnType<typeof RunnerConfigSchema.parse>;
  token: string | null;
  profile: ReturnType<typeof AdapterProfileSchema.parse>;
  capabilities: ReturnType<typeof AdapterCapabilitySchema.parse>;
  adapter: {
    baseUrl: string;
    adapterName: string;
    adapterVersion: string;
    profileVersion: string;
  };
};

type Cmi5PreflightResult =
  | Cmi5PreflightSuccess
  | {
      status: "error";
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };

function resolveAdapterToken(mode: "none" | "bearer", tokenFromEnv?: string): string | null {
  if (mode === "none") {
    return null;
  }

  if (!tokenFromEnv) {
    throw new Error("adapter.auth.tokenFromEnv is required when bearer auth is enabled");
  }

  const token = process.env[tokenFromEnv]?.trim();
  if (!token) {
    throw new Error(`adapter token env var ${tokenFromEnv} is not set`);
  }

  return token;
}

function validateRequiredOperations(operations: string[]): string[] {
  return requiredCmi5Operations.filter((operation) => !operations.includes(operation));
}

function findOperationPath(profile: ReturnType<typeof AdapterProfileSchema.parse>, operationName: string): string {
  const operation = profile.operations.find((candidate) => candidate.name === operationName);
  if (!operation) {
    throw new Error(`adapter profile operation path missing for ${operationName}`);
  }

  return operation.path;
}

function findOptionalOperationPath(
  profile: ReturnType<typeof AdapterProfileSchema.parse>,
  operationName: string,
): string | null {
  const operation = profile.operations.find((candidate) => candidate.name === operationName);
  return operation ? operation.path : null;
}

async function callAdapterOperation(
  operationName: string,
  path: string,
  baseUrl: string,
  token: string | null,
  payload: Record<string, unknown>,
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return fetch(new URL(path, baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

async function parseObjectResponse(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const parsed = (await response.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readStringField(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumberField(body: Record<string, unknown>, key: string): number | null {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function defaultPackageFixtureBase64(): string {
  return Buffer.from(
    JSON.stringify({
      manifest: {
        identifier: "cmi5.pkg.default",
        title: "Default cmi5 Package",
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
}

type RequirementStatus = "passed" | "failed" | "skipped" | "error";

type RequirementRecord = {
  status: RequirementStatus;
  evidence: string[];
  message?: string;
};

type CatapultParityLedgerEntry = {
  requirementId: string;
  catapultTarget: "runtime" | "package";
  upstreamAssertionId: string;
  status: RequirementStatus;
};

function inferCatapultTarget(requirementId: string): "runtime" | "package" {
  const packageSignals = ["package", "import", "manifest", "invalid-package", "structure"];
  return packageSignals.some((token) => requirementId.includes(token)) ? "package" : "runtime";
}

function buildCatapultParityLedger(requirements: Record<string, RequirementRecord>): {
  generatedAt: string;
  mappingStrategy: "heuristic-v1";
  entries: CatapultParityLedgerEntry[];
} {
  const entries = Object.entries(requirements)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([requirementId, record]) => ({
      requirementId,
      catapultTarget: inferCatapultTarget(requirementId),
      upstreamAssertionId: `catapult-${requirementId}`,
      status: record.status,
    }));

  return {
    generatedAt: new Date().toISOString(),
    mappingStrategy: "heuristic-v1",
    entries,
  };
}

function recordRequirement(
  requirements: Record<string, RequirementRecord>,
  requirementId: string,
  status: RequirementStatus,
  evidence: string[],
  message?: string,
): void {
  requirements[requirementId] = {
    status,
    evidence,
    ...(message ? { message } : {}),
  };
}

async function runPreflight(configPath: string): Promise<Cmi5PreflightResult> {
  try {
    const config = RunnerConfigSchema.parse(await readConfig(configPath));
    if (config.suite.name !== "cmi5" || !config.adapter) {
      return {
        status: "error",
        code: "invalid_suite",
        message: "cmi5 runner requires a cmi5 suite config with adapter",
      };
    }

    const token = resolveAdapterToken(config.adapter.auth.mode, config.adapter.auth.tokenFromEnv);

    const capabilitiesResponse = await fetchAdapterCapabilities(config.adapter.baseUrl, token);
    if (!capabilitiesResponse.ok) {
      return {
        status: "error",
        code: "adapter_capabilities_fetch_failed",
        message: `adapter capabilities request failed (${capabilitiesResponse.status})`,
      };
    }

    const profileResponse = await fetchAdapterProfile(config.adapter.baseUrl, token);
    if (!profileResponse.ok) {
      return {
        status: "error",
        code: "adapter_profile_fetch_failed",
        message: `adapter profile request failed (${profileResponse.status})`,
      };
    }

    const capabilities = AdapterCapabilitySchema.parse(await capabilitiesResponse.json());
    const profile = AdapterProfileSchema.parse(await profileResponse.json());

    if (capabilities.adapterName !== profile.adapter.name || capabilities.adapterVersion !== profile.adapter.version) {
      return {
        status: "error",
        code: "adapter_identity_mismatch",
        message: "adapter capabilities and profile identity do not match",
      };
    }

    if (capabilities.profileVersion !== profile.profileVersion) {
      return {
        status: "error",
        code: "adapter_profile_version_mismatch",
        message: "adapter capabilities and profile version do not match",
      };
    }

    if (profile.suite !== "cmi5") {
      return {
        status: "error",
        code: "adapter_profile_suite_mismatch",
        message: "adapter profile suite must be cmi5",
      };
    }

    const profileOperationNames = profile.operations.map((operation) => operation.name);
    const missingProfileOperations = validateRequiredOperations(profileOperationNames);
    if (missingProfileOperations.length > 0) {
      return {
        status: "error",
        code: "adapter_profile_operations_missing",
        message: "adapter profile does not declare all required cmi5 operations",
        details: { missingOperations: missingProfileOperations },
      };
    }

    const missingOperations = validateRequiredOperations(capabilities.operations);
    if (missingOperations.length > 0) {
      return {
        status: "error",
        code: "adapter_operations_missing",
        message: "adapter does not declare all required cmi5 operations",
        details: { missingOperations },
      };
    }

    const operationsMissingFromCapabilities = profileOperationNames.filter(
      (operation) => !capabilities.operations.includes(operation),
    );
    if (operationsMissingFromCapabilities.length > 0) {
      return {
        status: "error",
        code: "adapter_capability_profile_mismatch",
        message: "adapter capabilities are missing operations declared in adapter profile",
        details: { operationsMissingFromCapabilities },
      };
    }

    return {
      status: "preflight_passed",
      config,
      token,
      profile,
      capabilities,
      adapter: {
        baseUrl: config.adapter.baseUrl,
        adapterName: capabilities.adapterName,
        adapterVersion: capabilities.adapterVersion,
        profileVersion: profile.profileVersion,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown run error";
    return {
      status: "error",
      code: "run_preflight_failed",
      message,
    };
  }
}

export async function runCmi5(configPath: string): Promise<RunCmi5Result> {
  const preflight = await runPreflight(configPath);
  if (preflight.status === "error") {
    return preflight;
  }

  const { capabilities, config, token, profile, adapter } = preflight;

  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const runId = `cmi5_${startedAtDate.getTime()}_${crypto.randomUUID()}`;

  const outputDir = resolve(process.cwd(), config.artifacts.outputDir);
  const summaryPath = join(outputDir, config.artifacts.summaryFile);
  const junitPath = join(outputDir, config.artifacts.junitFile);
  const requirementTracePath = join(outputDir, config.artifacts.requirementTraceFile);
  const runMetadataPath = join(outputDir, config.artifacts.runMetadataFile);
  const catapultParityPath = join(outputDir, "catapult-parity-ledger.json");

  const requirements: Record<string, RequirementRecord> = {};

  const fixtureOperationPath = findOperationPath(profile, "fixtures.provision");
  const packageImportPath = findOperationPath(profile, "cmi5.package.import");
  const launchCreatePath = findOperationPath(profile, "cmi5.launch.create");
  const launchFetchPath = findOptionalOperationPath(profile, "cmi5.launch.fetch");
  const launchDataPath = findOptionalOperationPath(profile, "cmi5.launch.data");
  const statementPostPath = findOptionalOperationPath(profile, "cmi5.au.statement.post");
  const statementGetPath = findOptionalOperationPath(profile, "cmi5.au.statement.get");
  const stateReloadPath = findOptionalOperationPath(profile, "cmi5.state.reload");
  const waivePath = findOperationPath(profile, "cmi5.registration.waive");
  const abandonPath = findOperationPath(profile, "cmi5.session.abandon");

  let importedPackageId = `pkg_${runId}`;
  let registrationId = "";
  let sessionId = "";
  let activityId = "";
  const supportsFetchSecurity = capabilities.optionalFeatures.includes("cmi5-fetch-auth-hardening");
  const supportsReplayProtection = capabilities.optionalFeatures.includes("cmi5-auth-request-replay-protection");
  const supportsPackageStructureValidation = capabilities.optionalFeatures.includes(
    "cmi5-package-structure-validation",
  );
  const supportsDurableState = capabilities.optionalFeatures.includes("cmi5-durable-state");
  const supportsCrossSystemIntegration = capabilities.optionalFeatures.includes("cmi5-cross-system-integration");

  const exchangeLaunchAccess = async (
    fetchUrl: string,
  ): Promise<{ authToken: string | null; launchDataUrl: string | null; status: number }> => {
    const fetchExchangeResponse = await fetch(fetchUrl, { method: "POST" });
    const fetchExchangeBody = await parseObjectResponse(fetchExchangeResponse);
    const authToken = fetchExchangeBody ? readStringField(fetchExchangeBody, "auth-token") : null;
    const launchDataUrl = fetchExchangeBody ? readStringField(fetchExchangeBody, "launchDataUrl") : null;

    return {
      authToken,
      launchDataUrl,
      status: fetchExchangeResponse.status,
    };
  };

  const fixtureResponse = await callAdapterOperation(
    "fixtures.provision",
    fixtureOperationPath,
    adapter.baseUrl,
    token,
    {
      fixtureId: `emergent-lts-${runId}`,
    },
  );
  if (fixtureResponse.ok) {
    recordRequirement(requirements, "lts-fixtures-provision", "passed", ["fixtures.provision returned success"]);
  } else {
    recordRequirement(
      requirements,
      "lts-fixtures-provision",
      "failed",
      [`fixtures.provision status ${fixtureResponse.status}`],
      "fixtures provisioning failed",
    );
  }

  const invalidImportResponse = await callAdapterOperation(
    "cmi5.package.import",
    packageImportPath,
    adapter.baseUrl,
    token,
    {
      packageBase64: "not-base64",
    },
  );
  if (invalidImportResponse.status === 400) {
    recordRequirement(requirements, "lts-invalid-package-rejection", "passed", [
      "cmi5.package.import rejected invalid base64 with 400",
    ]);
  } else {
    recordRequirement(
      requirements,
      "lts-invalid-package-rejection",
      "failed",
      [`cmi5.package.import invalid payload status ${invalidImportResponse.status}`],
      "invalid package did not return 400",
    );
  }

  if (supportsPackageStructureValidation) {
    const packageStructureEvidence: string[] = [];
    let packageStructureFailed = false;

    const invalidPackageCases = [
      {
        label: "not-json",
        packageBase64: Buffer.from("plain-text-package", "utf8").toString("base64"),
      },
      {
        label: "missing-manifest",
        packageBase64: Buffer.from(
          JSON.stringify({
            aus: [{ id: "au-1", launchUrl: "https://example.invalid/au/1", moveOn: "Completed" }],
          }),
          "utf8",
        ).toString("base64"),
      },
      {
        label: "missing-aus",
        packageBase64: Buffer.from(
          JSON.stringify({
            manifest: { identifier: "pkg.missing.aus", title: "No AUs", version: "1.0.0" },
          }),
          "utf8",
        ).toString("base64"),
      },
      {
        label: "invalid-au-moveon",
        packageBase64: Buffer.from(
          JSON.stringify({
            manifest: { identifier: "pkg.invalid.moveon", title: "Invalid MoveOn", version: "1.0.0" },
            aus: [{ id: "au-1", launchUrl: "https://example.invalid/au/1", moveOn: "Any" }],
          }),
          "utf8",
        ).toString("base64"),
      },
    ] as const;

    for (const testCase of invalidPackageCases) {
      const invalidStructureResponse = await callAdapterOperation(
        "cmi5.package.import",
        packageImportPath,
        adapter.baseUrl,
        token,
        {
          packageBase64: testCase.packageBase64,
        },
      );

      packageStructureEvidence.push(`${testCase.label}=>expected:400,actual:${invalidStructureResponse.status}`);
      if (invalidStructureResponse.status !== 400) {
        packageStructureFailed = true;
      }
    }

    if (!packageStructureFailed) {
      recordRequirement(requirements, "lts-package-structure-matrix", "passed", packageStructureEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-package-structure-matrix",
        "failed",
        packageStructureEvidence,
        "one or more package structure validation checks failed",
      );
    }
  } else {
    recordRequirement(requirements, "lts-package-structure-matrix", "skipped", [
      "adapter did not advertise cmi5-package-structure-validation optional feature",
    ]);
  }

  const suiteConfigPackageBase64 =
    typeof config.suiteConfig.packageBase64 === "string" ? config.suiteConfig.packageBase64 : null;
  const packageBase64 = suiteConfigPackageBase64 ?? defaultPackageFixtureBase64();
  const packageIdFromConfig =
    typeof config.suiteConfig.packageId === "string" ? config.suiteConfig.packageId.trim() : "";
  importedPackageId = packageIdFromConfig.length > 0 ? packageIdFromConfig : importedPackageId;

  const importResponse = await callAdapterOperation("cmi5.package.import", packageImportPath, adapter.baseUrl, token, {
    packageId: importedPackageId,
    packageBase64,
  });
  if (!importResponse.ok) {
    recordRequirement(
      requirements,
      "lts-package-import",
      "failed",
      [`cmi5.package.import status ${importResponse.status}`],
      "package import failed",
    );
  } else {
    recordRequirement(requirements, "lts-package-import", "passed", ["cmi5.package.import returned success"]);
  }

  const expectedLearnerId = "learner@emergent.test";

  const initialLaunchResponse = await callAdapterOperation(
    "cmi5.launch.create",
    launchCreatePath,
    adapter.baseUrl,
    token,
    {
      packageId: importedPackageId,
      learnerId: expectedLearnerId,
    },
  );

  const initialLaunchBody = await parseObjectResponse(initialLaunchResponse);
  if (!initialLaunchResponse.ok || !initialLaunchBody) {
    recordRequirement(
      requirements,
      "lts-launch-create",
      "failed",
      [`cmi5.launch.create status ${initialLaunchResponse.status}`],
      "initial launch creation failed",
    );
  } else {
    const maybeRegistrationId = readStringField(initialLaunchBody, "registrationId");
    const maybeSessionId = readStringField(initialLaunchBody, "sessionId");
    const maybeActivityId = readStringField(initialLaunchBody, "activityId");

    if (maybeRegistrationId) {
      registrationId = maybeRegistrationId;
    }
    if (maybeSessionId) {
      sessionId = maybeSessionId;
    }
    if (maybeActivityId) {
      activityId = maybeActivityId;
    }

    const launchUrl = readStringField(initialLaunchBody, "launchUrl");
    const hasLaunchUrl = launchUrl !== null;

    if (registrationId.length > 0 && sessionId.length > 0 && hasLaunchUrl) {
      recordRequirement(requirements, "lts-launch-create", "passed", [
        "cmi5.launch.create returned registrationId, sessionId, and launchUrl",
      ]);
    } else {
      recordRequirement(
        requirements,
        "lts-launch-create",
        "failed",
        ["cmi5.launch.create missing registrationId/sessionId/launchUrl"],
        "launch response was incomplete",
      );
    }

    const launchMode = readStringField(initialLaunchBody, "launchMode");
    const moveOn = readStringField(initialLaunchBody, "moveOn");
    const launchParameters = readStringField(initialLaunchBody, "launchParameters");
    const masteryScore = readNumberField(initialLaunchBody, "masteryScore");
    const fetchUrl = readStringField(initialLaunchBody, "fetch");
    const endpoint = readStringField(initialLaunchBody, "endpoint");
    const contextTemplateValue = initialLaunchBody.contextTemplate;
    const contextTemplate =
      contextTemplateValue && typeof contextTemplateValue === "object" && !Array.isArray(contextTemplateValue)
        ? (contextTemplateValue as Record<string, unknown>)
        : null;
    const contextExtensionsValue = contextTemplate?.extensions;
    const contextExtensions =
      contextExtensionsValue && typeof contextExtensionsValue === "object" && !Array.isArray(contextExtensionsValue)
        ? (contextExtensionsValue as Record<string, unknown>)
        : null;
    const sessionExtension = contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/sessionid"];
    const launchModeExtension = contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/launchmode"];
    const moveOnExtension = contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/moveon"];
    const launchParametersExtension =
      contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/launchparameters"];
    const masteryScoreExtension = contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/masteryscore"];
    const contextActivitiesValue = contextTemplate?.contextActivities;
    const contextActivities =
      contextActivitiesValue && typeof contextActivitiesValue === "object" && !Array.isArray(contextActivitiesValue)
        ? (contextActivitiesValue as Record<string, unknown>)
        : null;
    const groupingValue = contextActivities?.grouping;
    const grouping = Array.isArray(groupingValue) ? groupingValue : null;
    const groupingFirst = grouping && grouping.length > 0 ? grouping[0] : null;
    const groupingFirstId =
      groupingFirst && typeof groupingFirst === "object" && !Array.isArray(groupingFirst)
        ? readStringField(groupingFirst as Record<string, unknown>, "id")
        : null;

    const launchDataValid =
      launchMode === "Normal" &&
      moveOn === "CompletedAndPassed" &&
      launchParameters !== null &&
      masteryScore === 0.9 &&
      fetchUrl !== null &&
      endpoint !== null &&
      typeof sessionExtension === "string" &&
      sessionExtension === sessionId &&
      launchModeExtension === "Normal" &&
      moveOnExtension === "CompletedAndPassed" &&
      launchParametersExtension === launchParameters &&
      masteryScoreExtension === masteryScore &&
      groupingFirstId === activityId;

    if (launchDataValid) {
      recordRequirement(requirements, "lts-launch-data-contract", "passed", [
        "launch data fields match baseline contract",
      ]);
    } else {
      recordRequirement(
        requirements,
        "lts-launch-data-contract",
        "failed",
        [
          `launchMode=${String(launchMode)}`,
          `moveOn=${String(moveOn)}`,
          `masteryScore=${String(masteryScore)}`,
          `sessionExtension=${String(sessionExtension)}`,
        ],
        "launch data contract fields were missing or invalid",
      );
    }

    const actorValue = initialLaunchBody.actor;
    const actor =
      actorValue && typeof actorValue === "object" && !Array.isArray(actorValue)
        ? (actorValue as Record<string, unknown>)
        : null;
    const accountValue = actor?.account;
    const account =
      accountValue && typeof accountValue === "object" && !Array.isArray(accountValue)
        ? (accountValue as Record<string, unknown>)
        : null;
    const actorAccountName = account ? readStringField(account, "name") : null;
    const actorAccountHomePage = account ? readStringField(account, "homePage") : null;
    const entitlementKey = readStringField(initialLaunchBody, "entitlementKey");

    const actorEntitlementValid =
      actorAccountName === expectedLearnerId &&
      actorAccountHomePage === "https://w3id.org/xapi/cmi5/catapult/lts" &&
      entitlementKey === `entitlement-${expectedLearnerId}`;

    if (actorEntitlementValid) {
      recordRequirement(requirements, "lts-actor-entitlement-contract", "passed", [
        "actor account and entitlementKey match expected launch identity",
      ]);
    } else {
      recordRequirement(
        requirements,
        "lts-actor-entitlement-contract",
        "failed",
        [
          `actorName=${String(actorAccountName)}`,
          `actorHomePage=${String(actorAccountHomePage)}`,
          `entitlementKey=${String(entitlementKey)}`,
        ],
        "actor/account or entitlement contract failed",
      );
    }

    let launchUrlQueryValid = false;
    const launchUrlEvidence: string[] = [];
    if (launchUrl) {
      try {
        const parsedLaunchUrl = new URL(launchUrl);
        const fetchParam = parsedLaunchUrl.searchParams.get("fetch");
        const registrationParam = parsedLaunchUrl.searchParams.get("registration");
        const actorParam = parsedLaunchUrl.searchParams.get("actor");
        const activityIdParam = parsedLaunchUrl.searchParams.get("activityId");
        const endpointParam = parsedLaunchUrl.searchParams.get("endpoint");
        const launchModeParam = parsedLaunchUrl.searchParams.get("launchMode");
        const moveOnParam = parsedLaunchUrl.searchParams.get("moveOn");
        const masteryScoreParam = parsedLaunchUrl.searchParams.get("masteryScore");
        const launchParametersParam = parsedLaunchUrl.searchParams.get("launchParameters");

        launchUrlEvidence.push(
          `fetch=${String(fetchParam)}`,
          `registration=${String(registrationParam)}`,
          `actor=${String(actorParam)}`,
          `activityId=${String(activityIdParam)}`,
          `endpoint=${String(endpointParam)}`,
          `launchMode=${String(launchModeParam)}`,
          `moveOn=${String(moveOnParam)}`,
          `masteryScore=${String(masteryScoreParam)}`,
          `launchParameters=${String(launchParametersParam)}`,
        );

        launchUrlQueryValid =
          fetchParam === fetchUrl &&
          registrationParam === registrationId &&
          actorParam === expectedLearnerId &&
          activityIdParam === activityId &&
          endpointParam === endpoint &&
          launchModeParam === launchMode &&
          moveOnParam === moveOn &&
          masteryScoreParam === String(masteryScore) &&
          launchParametersParam === launchParameters;
      } catch {
        launchUrlEvidence.push("launchUrl parse error");
      }
    } else {
      launchUrlEvidence.push("missing launchUrl");
    }

    if (launchUrlQueryValid) {
      recordRequirement(requirements, "lts-launch-url-query-contract", "passed", launchUrlEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-launch-url-query-contract",
        "failed",
        launchUrlEvidence,
        "launchUrl query contract fields were missing or inconsistent",
      );
    }

    if (fetchUrl && launchFetchPath && launchDataPath) {
      const fetchLaunchDataEvidence: string[] = [];
      let fetchLaunchDataFailed = false;

      const expectedFetchPath = new URL(launchFetchPath, adapter.baseUrl).pathname;
      let fetchPathMatches = false;
      try {
        fetchPathMatches = new URL(fetchUrl).pathname === expectedFetchPath;
      } catch {
        fetchPathMatches = false;
      }
      fetchLaunchDataEvidence.push(`fetchPathMatches=${String(fetchPathMatches)}`);
      if (!fetchPathMatches) {
        fetchLaunchDataFailed = true;
      }

      const fetchExchangeResponse = await fetch(fetchUrl, { method: "POST" });
      const fetchExchangeBody = await parseObjectResponse(fetchExchangeResponse);
      const authToken = fetchExchangeBody ? readStringField(fetchExchangeBody, "auth-token") : null;
      const launchDataUrl = fetchExchangeBody ? readStringField(fetchExchangeBody, "launchDataUrl") : null;

      fetchLaunchDataEvidence.push(
        `fetchExchangeStatus=${fetchExchangeResponse.status}`,
        `authToken=${String(authToken !== null)}`,
        `launchDataUrl=${String(launchDataUrl)}`,
      );

      if (!fetchExchangeResponse.ok || authToken === null || launchDataUrl === null) {
        fetchLaunchDataFailed = true;
      }

      let launchDataStatus = 0;
      let repeatedFetchStatus = 0;

      if (authToken && launchDataUrl) {
        const expectedLaunchDataPath = new URL(launchDataPath, adapter.baseUrl).pathname;
        let launchDataPathMatches = false;
        try {
          launchDataPathMatches = new URL(launchDataUrl).pathname === expectedLaunchDataPath;
        } catch {
          launchDataPathMatches = false;
        }
        fetchLaunchDataEvidence.push(`launchDataPathMatches=${String(launchDataPathMatches)}`);
        if (!launchDataPathMatches) {
          fetchLaunchDataFailed = true;
        }

        const launchDataResponse = await fetch(launchDataUrl, {
          headers: { authorization: authToken },
          method: "GET",
        });
        launchDataStatus = launchDataResponse.status;
        const launchDataBody = await parseObjectResponse(launchDataResponse);

        const launchDataRegistration = launchDataBody ? readStringField(launchDataBody, "registration") : null;
        const launchSessionId = launchDataBody ? readStringField(launchDataBody, "launchSessionId") : null;
        const launchDataMode = launchDataBody ? readStringField(launchDataBody, "launchMode") : null;
        const launchDataMoveOn = launchDataBody ? readStringField(launchDataBody, "moveOn") : null;

        const launchDataContextValue = launchDataBody?.contextTemplate;
        const launchDataContext =
          launchDataContextValue && typeof launchDataContextValue === "object" && !Array.isArray(launchDataContextValue)
            ? (launchDataContextValue as Record<string, unknown>)
            : null;
        const launchDataContextRegistration = launchDataContext
          ? readStringField(launchDataContext, "registration")
          : null;
        const launchDataExtensionsValue = launchDataContext?.extensions;
        const launchDataExtensions =
          launchDataExtensionsValue &&
          typeof launchDataExtensionsValue === "object" &&
          !Array.isArray(launchDataExtensionsValue)
            ? (launchDataExtensionsValue as Record<string, unknown>)
            : null;
        const launchDataSessionExtension =
          launchDataExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/sessionid"];

        const launchDataValid =
          launchDataResponse.ok &&
          launchDataRegistration === registrationId &&
          launchSessionId === sessionId &&
          launchDataMode === launchMode &&
          launchDataMoveOn === moveOn &&
          launchDataContextRegistration === registrationId &&
          launchDataSessionExtension === sessionId;

        fetchLaunchDataEvidence.push(
          `launchDataStatus=${launchDataStatus}`,
          `launchDataRegistration=${String(launchDataRegistration)}`,
          `launchSessionId=${String(launchSessionId)}`,
          `launchDataMode=${String(launchDataMode)}`,
          `launchDataMoveOn=${String(launchDataMoveOn)}`,
          `launchDataContextRegistration=${String(launchDataContextRegistration)}`,
          `launchDataSessionExtension=${String(launchDataSessionExtension)}`,
        );
        if (!launchDataValid) {
          fetchLaunchDataFailed = true;
        }

        const repeatedFetchResponse = await fetch(fetchUrl, { method: "POST" });
        repeatedFetchStatus = repeatedFetchResponse.status;
        fetchLaunchDataEvidence.push(`repeatedFetchStatus=${repeatedFetchStatus}`);
        if (repeatedFetchStatus !== 409) {
          fetchLaunchDataFailed = true;
        }
      }

      if (!fetchLaunchDataFailed) {
        recordRequirement(requirements, "lts-fetch-launch-data-contract", "passed", fetchLaunchDataEvidence);
      } else {
        recordRequirement(
          requirements,
          "lts-fetch-launch-data-contract",
          "failed",
          fetchLaunchDataEvidence,
          "fetch exchange or launch-data contract failed",
        );
      }
    } else {
      recordRequirement(requirements, "lts-fetch-launch-data-contract", "skipped", [
        "adapter profile did not advertise cmi5.launch.fetch and cmi5.launch.data",
      ]);
    }

    if (fetchUrl && launchFetchPath && launchDataPath && supportsFetchSecurity) {
      const securityEvidence: string[] = [];
      let securityFailed = false;

      const securityLaunchResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        {
          packageId: importedPackageId,
          learnerId: `${expectedLearnerId}.security-base`,
        },
      );
      const securityLaunchBody = await parseObjectResponse(securityLaunchResponse);
      const securitySessionId = securityLaunchBody ? readStringField(securityLaunchBody, "sessionId") : null;
      const securityRegistrationId = securityLaunchBody ? readStringField(securityLaunchBody, "registrationId") : null;
      const securityFetchUrl = securityLaunchBody ? readStringField(securityLaunchBody, "fetch") : null;

      if (!securityLaunchResponse.ok || !securitySessionId || !securityRegistrationId || !securityFetchUrl) {
        securityEvidence.push(
          `securityLaunchStatus=${securityLaunchResponse.status},session=${String(securitySessionId)},registration=${String(securityRegistrationId)},fetch=${String(securityFetchUrl)}`,
        );
        securityFailed = true;
      }

      const parsedFetchUrl = securityFetchUrl ? new URL(securityFetchUrl) : null;
      const badFetchUrl = securityFetchUrl ? new URL(securityFetchUrl) : null;
      badFetchUrl?.searchParams.set("token", "fetch-invalid");
      const missingFetchParamsUrl = new URL(launchFetchPath, adapter.baseUrl);

      const missingFetchParamsResponse = await fetch(missingFetchParamsUrl, { method: "POST" });
      securityEvidence.push(`missingFetchParamsStatus=${missingFetchParamsResponse.status}`);
      if (missingFetchParamsResponse.status !== 400) {
        securityFailed = true;
      }

      if (badFetchUrl) {
        const invalidFetchTokenResponse = await fetch(badFetchUrl, { method: "POST" });
        securityEvidence.push(`invalidFetchTokenStatus=${invalidFetchTokenResponse.status}`);
        if (invalidFetchTokenResponse.status !== 404) {
          securityFailed = true;
        }
      }

      const launchAccess = securityFetchUrl
        ? await exchangeLaunchAccess(securityFetchUrl)
        : { authToken: null, launchDataUrl: null, status: 0 };
      const authToken = launchAccess.authToken;
      const launchDataUrl = launchAccess.launchDataUrl;
      securityEvidence.push(
        `securityFetchExchangeStatus=${launchAccess.status}`,
        `securityAuthToken=${String(authToken !== null)}`,
        `securityLaunchDataUrl=${String(launchDataUrl)}`,
      );
      if (!authToken || !launchDataUrl) {
        securityFailed = true;
      } else {
        const missingAuthLaunchDataResponse = await fetch(launchDataUrl, { method: "GET" });
        securityEvidence.push(`missingAuthLaunchDataStatus=${missingAuthLaunchDataResponse.status}`);
        if (missingAuthLaunchDataResponse.status !== 401) {
          securityFailed = true;
        }

        const invalidAuthLaunchDataResponse = await fetch(launchDataUrl, {
          method: "GET",
          headers: { authorization: "Basic invalid" },
        });
        securityEvidence.push(`invalidAuthLaunchDataStatus=${invalidAuthLaunchDataResponse.status}`);
        if (invalidAuthLaunchDataResponse.status !== 401) {
          securityFailed = true;
        }

        const secondaryLaunchResponse = await callAdapterOperation(
          "cmi5.launch.create",
          launchCreatePath,
          adapter.baseUrl,
          token,
          {
            packageId: importedPackageId,
            learnerId: `${expectedLearnerId}.security`,
          },
        );
        const secondaryLaunchBody = await parseObjectResponse(secondaryLaunchResponse);
        const secondaryFetchUrl = secondaryLaunchBody ? readStringField(secondaryLaunchBody, "fetch") : null;

        if (!secondaryLaunchResponse.ok || !secondaryFetchUrl) {
          securityEvidence.push(`secondaryLaunchStatus=${secondaryLaunchResponse.status}`);
          securityFailed = true;
        } else {
          const secondaryExchange = await exchangeLaunchAccess(secondaryFetchUrl);
          const secondaryLaunchDataUrl = secondaryExchange.launchDataUrl;
          securityEvidence.push(`secondaryFetchStatus=${secondaryExchange.status}`);
          if (!secondaryLaunchDataUrl) {
            securityFailed = true;
          } else {
            const wrongSessionAuthResponse = await fetch(secondaryLaunchDataUrl, {
              method: "GET",
              headers: { authorization: authToken },
            });
            securityEvidence.push(`wrongSessionAuthStatus=${wrongSessionAuthResponse.status}`);
            if (wrongSessionAuthResponse.status !== 401) {
              securityFailed = true;
            }
          }
        }

        if (statementPostPath && supportsReplayProtection) {
          const replayRequestId = `replay-${runId}`;
          const validStatementResponse = await fetch(new URL(statementPostPath, adapter.baseUrl), {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authToken,
              "x-cmi5-request-id": replayRequestId,
            },
            body: JSON.stringify({
              sessionId: securitySessionId,
              registrationId: securityRegistrationId,
              verb: "initialized",
            }),
          });

          const replayStatementResponse = await fetch(new URL(statementPostPath, adapter.baseUrl), {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authToken,
              "x-cmi5-request-id": replayRequestId,
            },
            body: JSON.stringify({
              sessionId: securitySessionId,
              registrationId: securityRegistrationId,
              verb: "launched",
            }),
          });

          securityEvidence.push(
            `initialReplayGuardStatementStatus=${validStatementResponse.status}`,
            `replayedRequestIdStatus=${replayStatementResponse.status}`,
          );
          if (validStatementResponse.status !== 200 || replayStatementResponse.status !== 409) {
            securityFailed = true;
          }
        } else {
          securityEvidence.push("replayProtectionCheck=skipped");
        }
      }

      if (parsedFetchUrl) {
        const mutatedSessionFetchUrl = new URL(parsedFetchUrl);
        mutatedSessionFetchUrl.searchParams.set("sessionId", "missing-session");
        const mismatchedSessionFetchResponse = await fetch(mutatedSessionFetchUrl, { method: "POST" });
        securityEvidence.push(`mismatchedSessionFetchStatus=${mismatchedSessionFetchResponse.status}`);
        if (mismatchedSessionFetchResponse.status !== 404) {
          securityFailed = true;
        }
      }

      if (!securityFailed) {
        recordRequirement(requirements, "lts-fetch-auth-security-matrix", "passed", securityEvidence);
      } else {
        recordRequirement(
          requirements,
          "lts-fetch-auth-security-matrix",
          "failed",
          securityEvidence,
          "one or more fetch/auth security checks failed",
        );
      }
    } else {
      recordRequirement(requirements, "lts-fetch-auth-security-matrix", "skipped", [
        "adapter did not advertise cmi5-fetch-auth-hardening optional feature",
      ]);
    }

    if (statementPostPath && statementGetPath && launchFetchPath) {
      const runtimeEvidence: string[] = [];
      let runtimeFailed = false;

      const statementMatrix = [
        {
          label: "passed-flow",
          moveOn: "Passed",
          sequence: ["initialized", "launched", "progressed", "completed", "passed", "terminated"],
          invalidVerb: "failed",
        },
        {
          label: "completed-flow",
          moveOn: "Completed",
          sequence: ["initialized", "launched", "progressed", "completed", "failed", "terminated"],
          invalidVerb: null,
        },
        {
          label: "completed-and-passed-flow",
          moveOn: "CompletedAndPassed",
          sequence: ["initialized", "launched", "completed", "passed", "terminated"],
          invalidVerb: "failed",
        },
        {
          label: "completed-or-passed-flow",
          moveOn: "CompletedOrPassed",
          sequence: ["initialized", "launched", "progressed", "completed", "passed", "terminated"],
          invalidVerb: "failed",
        },
        {
          label: "not-applicable-flow",
          moveOn: "NotApplicable",
          sequence: ["initialized", "launched", "progressed", "terminated"],
          invalidVerb: "passed",
        },
      ] as const;

      for (const matrixCase of statementMatrix) {
        const launchResponse = await callAdapterOperation(
          "cmi5.launch.create",
          launchCreatePath,
          adapter.baseUrl,
          token,
          {
            packageId: importedPackageId,
            learnerId: expectedLearnerId,
            moveOn: matrixCase.moveOn,
          },
        );
        const launchBody = await parseObjectResponse(launchResponse);
        const matrixRegistrationId = launchBody ? readStringField(launchBody, "registrationId") : null;
        const matrixSessionId = launchBody ? readStringField(launchBody, "sessionId") : null;
        const matrixFetchUrl = launchBody ? readStringField(launchBody, "fetch") : null;

        if (!launchResponse.ok || !matrixRegistrationId || !matrixSessionId || !matrixFetchUrl) {
          runtimeEvidence.push(
            `${matrixCase.label}=>launchStatus:${launchResponse.status},registration:${String(matrixRegistrationId)},session:${String(matrixSessionId)},fetch:${String(matrixFetchUrl)}`,
          );
          runtimeFailed = true;
          continue;
        }

        const expectedFetchPath = new URL(launchFetchPath, adapter.baseUrl).pathname;
        let fetchPathMatches = false;
        try {
          fetchPathMatches = new URL(matrixFetchUrl).pathname === expectedFetchPath;
        } catch {
          fetchPathMatches = false;
        }

        const launchAccess = await exchangeLaunchAccess(matrixFetchUrl);
        const authToken = launchAccess.authToken;

        if (!fetchPathMatches || !authToken) {
          runtimeEvidence.push(
            `${matrixCase.label}=>fetchPathMatches:${String(fetchPathMatches)},fetchStatus:${launchAccess.status},authToken:${String(authToken !== null)}`,
          );
          runtimeFailed = true;
          continue;
        }

        const statementStatuses: string[] = [];
        let sequenceFailed = false;

        for (const verb of matrixCase.sequence) {
          const postResponse = await fetch(new URL(statementPostPath, adapter.baseUrl), {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authToken,
            },
            body: JSON.stringify({
              sessionId: matrixSessionId,
              registrationId: matrixRegistrationId,
              verb,
            }),
          });

          statementStatuses.push(`${verb}:${postResponse.status}`);
          if (!postResponse.ok) {
            sequenceFailed = true;
          }
        }

        let invalidStatus = 0;
        if (matrixCase.invalidVerb) {
          const invalidResponse = await fetch(new URL(statementPostPath, adapter.baseUrl), {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authToken,
            },
            body: JSON.stringify({
              sessionId: matrixSessionId,
              registrationId: matrixRegistrationId,
              verb: matrixCase.invalidVerb,
            }),
          });
          invalidStatus = invalidResponse.status;
        }

        const statementGetUrl = new URL(statementGetPath, adapter.baseUrl);
        statementGetUrl.searchParams.set("sessionId", matrixSessionId);

        const getResponse = await fetch(statementGetUrl, {
          method: "GET",
          headers: {
            authorization: authToken,
          },
        });
        const getBody = await parseObjectResponse(getResponse);

        const statementsValue = getBody?.statements;
        const statements = Array.isArray(statementsValue)
          ? statementsValue.filter((statement) => statement && typeof statement === "object")
          : [];
        const verbs = statements
          .map((statement) => {
            const value = (statement as Record<string, unknown>).verb;
            return typeof value === "string" ? value : null;
          })
          .filter((value): value is string => value !== null);
        const verbSequenceMatches = verbs.join(",") === matrixCase.sequence.join(",");

        const lifecycleValue = getBody?.lifecycle;
        const lifecycle =
          lifecycleValue && typeof lifecycleValue === "object" && !Array.isArray(lifecycleValue)
            ? (lifecycleValue as Record<string, unknown>)
            : null;
        const lifecycleTerminated = lifecycle?.terminated === true;
        const lifecycleMoveOnSatisfied = lifecycle?.moveOnSatisfied === true;

        const casePassed =
          !sequenceFailed &&
          getResponse.ok &&
          verbSequenceMatches &&
          lifecycleTerminated &&
          lifecycleMoveOnSatisfied &&
          (matrixCase.invalidVerb ? invalidStatus === 409 : true);

        runtimeEvidence.push(
          `${matrixCase.label}=>fetchStatus:${launchAccess.status},post:[${statementStatuses.join("|")}],invalid:${String(matrixCase.invalidVerb)}:${invalidStatus},get:${getResponse.status},sequenceMatches:${String(verbSequenceMatches)},terminated:${String(lifecycleTerminated)},moveOnSatisfied:${String(lifecycleMoveOnSatisfied)}`,
        );

        if (!casePassed) {
          runtimeFailed = true;
        }
      }

      if (!runtimeFailed) {
        recordRequirement(requirements, "lts-au-runtime-lifecycle-matrix", "passed", runtimeEvidence);
      } else {
        recordRequirement(
          requirements,
          "lts-au-runtime-lifecycle-matrix",
          "failed",
          runtimeEvidence,
          "one or more AU runtime lifecycle flows failed",
        );
      }
    } else {
      recordRequirement(requirements, "lts-au-runtime-lifecycle-matrix", "skipped", [
        "adapter profile did not advertise cmi5.au.statement.post and cmi5.au.statement.get",
      ]);
    }

    const identityMatrixCases = [
      {
        label: "custom-learner-entitlement",
        learnerId: "learner.matrix@emergent.test",
        entitlementKey: "entitlement-matrix-001",
      },
    ] as const;

    const identityMatrixEvidence: string[] = [];
    let identityMatrixFailed = false;

    for (const matrixCase of identityMatrixCases) {
      const matrixResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        {
          packageId: importedPackageId,
          learnerId: matrixCase.learnerId,
          entitlementKey: matrixCase.entitlementKey,
        },
      );

      const matrixBody = await parseObjectResponse(matrixResponse);
      const returnedLearnerId = matrixBody ? readStringField(matrixBody, "learnerId") : null;
      const returnedEntitlement = matrixBody ? readStringField(matrixBody, "entitlementKey") : null;

      const matrixActorValue = matrixBody?.actor;
      const matrixActor =
        matrixActorValue && typeof matrixActorValue === "object" && !Array.isArray(matrixActorValue)
          ? (matrixActorValue as Record<string, unknown>)
          : null;
      const matrixAccountValue = matrixActor?.account;
      const matrixAccount =
        matrixAccountValue && typeof matrixAccountValue === "object" && !Array.isArray(matrixAccountValue)
          ? (matrixAccountValue as Record<string, unknown>)
          : null;
      const returnedActorName = matrixAccount ? readStringField(matrixAccount, "name") : null;

      const matrixLaunchUrl = matrixBody ? readStringField(matrixBody, "launchUrl") : null;
      let actorParamMatches = false;
      if (matrixLaunchUrl) {
        try {
          const parsedMatrixLaunchUrl = new URL(matrixLaunchUrl);
          actorParamMatches = parsedMatrixLaunchUrl.searchParams.get("actor") === matrixCase.learnerId;
        } catch {
          actorParamMatches = false;
        }
      }

      const passed =
        matrixResponse.ok &&
        returnedLearnerId === matrixCase.learnerId &&
        returnedEntitlement === matrixCase.entitlementKey &&
        returnedActorName === matrixCase.learnerId &&
        actorParamMatches;

      identityMatrixEvidence.push(
        `${matrixCase.label}=>status:${matrixResponse.status},learner:${String(returnedLearnerId)},entitlement:${String(returnedEntitlement)},actor:${String(returnedActorName)},urlActor:${String(actorParamMatches)}`,
      );

      if (!passed) {
        identityMatrixFailed = true;
      }
    }

    if (!identityMatrixFailed) {
      recordRequirement(requirements, "lts-identity-override-matrix", "passed", identityMatrixEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-identity-override-matrix",
        "failed",
        identityMatrixEvidence,
        "one or more explicit learner/entitlement identity checks failed",
      );
    }

    const launchIdentityCases = [
      {
        label: "explicit-launch-registration-session",
        launchId: "launch-explicit-001",
        registrationId: "registration-explicit-001",
        sessionId: "session-explicit-001",
      },
    ] as const;

    const launchIdentityEvidence: string[] = [];
    let launchIdentityFailed = false;

    for (const matrixCase of launchIdentityCases) {
      const matrixResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        {
          packageId: importedPackageId,
          launchId: matrixCase.launchId,
          registrationId: matrixCase.registrationId,
          sessionId: matrixCase.sessionId,
          learnerId: expectedLearnerId,
        },
      );

      const matrixBody = await parseObjectResponse(matrixResponse);
      const returnedLaunchId = matrixBody ? readStringField(matrixBody, "launchId") : null;
      const returnedRegistrationId = matrixBody ? readStringField(matrixBody, "registrationId") : null;
      const returnedSessionId = matrixBody ? readStringField(matrixBody, "sessionId") : null;
      const returnedFetch = matrixBody ? readStringField(matrixBody, "fetch") : null;
      const returnedLaunchUrl = matrixBody ? readStringField(matrixBody, "launchUrl") : null;

      let launchUrlRegistrationMatches = false;
      let launchUrlFetchMatches = false;
      if (returnedLaunchUrl) {
        try {
          const parsedLaunchUrl = new URL(returnedLaunchUrl);
          launchUrlRegistrationMatches = parsedLaunchUrl.searchParams.get("registration") === matrixCase.registrationId;
          launchUrlFetchMatches = parsedLaunchUrl.searchParams.get("fetch") === returnedFetch;
        } catch {
          launchUrlRegistrationMatches = false;
          launchUrlFetchMatches = false;
        }
      }

      const contextTemplateValue = matrixBody?.contextTemplate;
      const contextTemplate =
        contextTemplateValue && typeof contextTemplateValue === "object" && !Array.isArray(contextTemplateValue)
          ? (contextTemplateValue as Record<string, unknown>)
          : null;
      const contextExtensionsValue = contextTemplate?.extensions;
      const contextExtensions =
        contextExtensionsValue && typeof contextExtensionsValue === "object" && !Array.isArray(contextExtensionsValue)
          ? (contextExtensionsValue as Record<string, unknown>)
          : null;
      const returnedSessionExtension =
        typeof contextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/sessionid"] === "string"
          ? (contextExtensions["https://w3id.org/xapi/cmi5/context/extensions/sessionid"] as string)
          : null;

      const fetchHasSession =
        typeof returnedFetch === "string" && returnedFetch.includes(`sessionId=${matrixCase.sessionId}`);
      const launchUrlHasLaunchId =
        typeof returnedLaunchUrl === "string" && returnedLaunchUrl.includes(`/${matrixCase.launchId}?`);

      const passed =
        matrixResponse.ok &&
        returnedLaunchId === matrixCase.launchId &&
        returnedRegistrationId === matrixCase.registrationId &&
        returnedSessionId === matrixCase.sessionId &&
        returnedSessionExtension === matrixCase.sessionId &&
        fetchHasSession &&
        launchUrlHasLaunchId &&
        launchUrlRegistrationMatches &&
        launchUrlFetchMatches;

      launchIdentityEvidence.push(
        `${matrixCase.label}=>status:${matrixResponse.status},launch:${String(returnedLaunchId)},registration:${String(returnedRegistrationId)},session:${String(returnedSessionId)},sessionExt:${String(returnedSessionExtension)},fetchSession:${String(fetchHasSession)},urlLaunch:${String(launchUrlHasLaunchId)},urlRegistration:${String(launchUrlRegistrationMatches)},urlFetch:${String(launchUrlFetchMatches)}`,
      );

      if (!passed) {
        launchIdentityFailed = true;
      }
    }

    if (!launchIdentityFailed) {
      recordRequirement(requirements, "lts-launch-identity-passthrough", "passed", launchIdentityEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-launch-identity-passthrough",
        "failed",
        launchIdentityEvidence,
        "launchId/registrationId/sessionId passthrough contract failed",
      );
    }

    const moveOnMatrix = ["Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed", "NotApplicable"] as const;
    const moveOnEvidence: string[] = [];
    let moveOnFailed = false;
    const contextTemplateEvidence: string[] = [];
    let contextTemplateFailed = false;

    for (const matrixMoveOn of moveOnMatrix) {
      const matrixResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        {
          packageId: importedPackageId,
          moveOn: matrixMoveOn,
          learnerId: "learner@emergent.test",
          activityId: activityId || undefined,
        },
      );

      const matrixBody = await parseObjectResponse(matrixResponse);
      const returnedMoveOn = matrixBody ? readStringField(matrixBody, "moveOn") : null;
      const passed = matrixResponse.ok && returnedMoveOn === matrixMoveOn;
      moveOnEvidence.push(`${matrixMoveOn}=>status:${matrixResponse.status},returned:${String(returnedMoveOn)}`);

      const contextTemplateMatrixValue = matrixBody?.contextTemplate;
      const contextTemplateMatrix =
        contextTemplateMatrixValue &&
        typeof contextTemplateMatrixValue === "object" &&
        !Array.isArray(contextTemplateMatrixValue)
          ? (contextTemplateMatrixValue as Record<string, unknown>)
          : null;
      const matrixExtensionsValue = contextTemplateMatrix?.extensions;
      const matrixExtensions =
        matrixExtensionsValue && typeof matrixExtensionsValue === "object" && !Array.isArray(matrixExtensionsValue)
          ? (matrixExtensionsValue as Record<string, unknown>)
          : null;
      const matrixActivitiesValue = contextTemplateMatrix?.contextActivities;
      const matrixActivities =
        matrixActivitiesValue && typeof matrixActivitiesValue === "object" && !Array.isArray(matrixActivitiesValue)
          ? (matrixActivitiesValue as Record<string, unknown>)
          : null;
      const matrixGroupingValue = matrixActivities?.grouping;
      const matrixGrouping = Array.isArray(matrixGroupingValue) ? matrixGroupingValue : null;
      const matrixGroupingFirst = matrixGrouping && matrixGrouping.length > 0 ? matrixGrouping[0] : null;
      const matrixGroupingFirstId =
        matrixGroupingFirst && typeof matrixGroupingFirst === "object" && !Array.isArray(matrixGroupingFirst)
          ? readStringField(matrixGroupingFirst as Record<string, unknown>, "id")
          : null;

      const moveOnExtensionValid =
        matrixExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/moveon"] === matrixMoveOn;
      const groupingValid = matrixGroupingFirstId === activityId;
      contextTemplateEvidence.push(
        `${matrixMoveOn}=>moveOnExt:${String(moveOnExtensionValid)},grouping:${String(groupingValid)}`,
      );
      if (!moveOnExtensionValid || !groupingValid) {
        contextTemplateFailed = true;
      }

      if (!passed) {
        moveOnFailed = true;
      }
    }

    if (!moveOnFailed) {
      recordRequirement(requirements, "lts-moveon-matrix", "passed", moveOnEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-moveon-matrix",
        "failed",
        moveOnEvidence,
        "one or more moveOn variants failed round-trip validation",
      );
    }

    const launchModeMatrix = ["Browse", "Review"] as const;
    const launchModeEvidence: string[] = [];
    let launchModeFailed = false;

    for (const matrixLaunchMode of launchModeMatrix) {
      const matrixResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        {
          packageId: importedPackageId,
          launchMode: matrixLaunchMode,
          learnerId: "learner@emergent.test",
        },
      );
      const matrixBody = await parseObjectResponse(matrixResponse);
      const returnedLaunchMode = matrixBody ? readStringField(matrixBody, "launchMode") : null;
      const passed = matrixResponse.ok && returnedLaunchMode === matrixLaunchMode;

      const matrixContextTemplateValue = matrixBody?.contextTemplate;
      const matrixContextTemplate =
        matrixContextTemplateValue &&
        typeof matrixContextTemplateValue === "object" &&
        !Array.isArray(matrixContextTemplateValue)
          ? (matrixContextTemplateValue as Record<string, unknown>)
          : null;
      const matrixContextExtensionsValue = matrixContextTemplate?.extensions;
      const matrixContextExtensions =
        matrixContextExtensionsValue &&
        typeof matrixContextExtensionsValue === "object" &&
        !Array.isArray(matrixContextExtensionsValue)
          ? (matrixContextExtensionsValue as Record<string, unknown>)
          : null;
      const launchModeExtensionValid =
        matrixContextExtensions?.["https://w3id.org/xapi/cmi5/context/extensions/launchmode"] === matrixLaunchMode;
      contextTemplateEvidence.push(`${matrixLaunchMode}=>launchModeExt:${String(launchModeExtensionValid)}`);
      if (!launchModeExtensionValid) {
        contextTemplateFailed = true;
      }

      launchModeEvidence.push(
        `${matrixLaunchMode}=>status:${matrixResponse.status},returned:${String(returnedLaunchMode)}`,
      );
      if (!passed) {
        launchModeFailed = true;
      }
    }

    if (!launchModeFailed) {
      recordRequirement(requirements, "lts-launch-mode-matrix", "passed", launchModeEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-launch-mode-matrix",
        "failed",
        launchModeEvidence,
        "Browse/Review launch mode variants failed round-trip validation",
      );
    }

    if (!contextTemplateFailed) {
      recordRequirement(requirements, "lts-context-template-matrix", "passed", contextTemplateEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-context-template-matrix",
        "failed",
        contextTemplateEvidence,
        "one or more contextTemplate extension/grouping checks failed",
      );
    }

    const invalidLaunchCases: Array<{
      label: string;
      payload: Record<string, unknown>;
      expectedStatus: number;
    }> = [
      {
        label: "missing-package-id",
        payload: {},
        expectedStatus: 400,
      },
      {
        label: "unknown-package-id",
        payload: { packageId: "missing-package" },
        expectedStatus: 404,
      },
      {
        label: "invalid-launch-mode",
        payload: { packageId: importedPackageId, launchMode: "Sandbox" },
        expectedStatus: 400,
      },
      {
        label: "invalid-move-on",
        payload: { packageId: importedPackageId, moveOn: "Any" },
        expectedStatus: 400,
      },
      {
        label: "invalid-mastery-score",
        payload: { packageId: importedPackageId, masteryScore: 1.2 },
        expectedStatus: 400,
      },
      {
        label: "invalid-learner-id",
        payload: { packageId: importedPackageId, learnerId: "" },
        expectedStatus: 400,
      },
      {
        label: "invalid-launch-parameters",
        payload: { packageId: importedPackageId, launchParameters: "" },
        expectedStatus: 400,
      },
      {
        label: "invalid-activity-id",
        payload: { packageId: importedPackageId, activityId: "" },
        expectedStatus: 400,
      },
      {
        label: "invalid-entitlement-key",
        payload: { packageId: importedPackageId, entitlementKey: "" },
        expectedStatus: 400,
      },
    ];

    const invalidMatrixEvidence: string[] = [];
    let invalidMatrixFailed = false;

    for (const testCase of invalidLaunchCases) {
      const invalidResponse = await callAdapterOperation(
        "cmi5.launch.create",
        launchCreatePath,
        adapter.baseUrl,
        token,
        testCase.payload,
      );

      const passed = invalidResponse.status === testCase.expectedStatus;
      invalidMatrixEvidence.push(
        `${testCase.label}=>expected:${testCase.expectedStatus},actual:${invalidResponse.status}`,
      );
      if (!passed) {
        invalidMatrixFailed = true;
      }
    }

    if (!invalidMatrixFailed) {
      recordRequirement(requirements, "lts-invalid-launch-matrix", "passed", invalidMatrixEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-invalid-launch-matrix",
        "failed",
        invalidMatrixEvidence,
        "one or more invalid launch payload checks did not return expected status",
      );
    }
  }

  const resumeLaunchResponse = await callAdapterOperation(
    "cmi5.launch.create",
    launchCreatePath,
    adapter.baseUrl,
    token,
    {
      packageId: importedPackageId,
      registrationId,
      learnerId: "learner@emergent.test",
    },
  );
  const resumeLaunchBody = await parseObjectResponse(resumeLaunchResponse);
  if (!resumeLaunchResponse.ok || !resumeLaunchBody) {
    recordRequirement(
      requirements,
      "lts-resume-continuity",
      "failed",
      [`resume launch status ${resumeLaunchResponse.status}`],
      "resume launch failed",
    );
  } else {
    const resumedRegistrationId = resumeLaunchBody.registrationId;
    const resumedSessionId = resumeLaunchBody.sessionId;

    const registrationMatches =
      typeof resumedRegistrationId === "string" &&
      resumedRegistrationId.length > 0 &&
      registrationId.length > 0 &&
      resumedRegistrationId === registrationId;
    const sessionRotated =
      typeof resumedSessionId === "string" &&
      resumedSessionId.length > 0 &&
      sessionId.length > 0 &&
      resumedSessionId !== sessionId;

    if (registrationMatches && sessionRotated) {
      recordRequirement(requirements, "lts-resume-continuity", "passed", [
        "resume launch reused registrationId and issued a new sessionId",
      ]);
    } else {
      recordRequirement(
        requirements,
        "lts-resume-continuity",
        "failed",
        [
          `resume registration matches: ${String(registrationMatches)}`,
          `resume session rotated: ${String(sessionRotated)}`,
        ],
        "resume continuity contract was not satisfied",
      );
    }
  }

  const resumeMatrixCases: Array<{
    label: string;
    payload: Record<string, unknown>;
    expectedStatus: number;
  }> = [
    {
      label: "resume-missing-package-id",
      payload: { registrationId },
      expectedStatus: 400,
    },
    {
      label: "resume-missing-registration-id",
      payload: { packageId: importedPackageId },
      expectedStatus: 200,
    },
    {
      label: "resume-unknown-package-id",
      payload: { packageId: "missing-package", registrationId },
      expectedStatus: 404,
    },
  ];

  const resumeMatrixEvidence: string[] = [];
  let resumeMatrixFailed = false;

  for (const testCase of resumeMatrixCases) {
    const response = await callAdapterOperation(
      "cmi5.launch.create",
      launchCreatePath,
      adapter.baseUrl,
      token,
      testCase.payload,
    );

    const passed = response.status === testCase.expectedStatus;
    resumeMatrixEvidence.push(`${testCase.label}=>expected:${testCase.expectedStatus},actual:${response.status}`);
    if (!passed) {
      resumeMatrixFailed = true;
    }
  }

  if (!resumeMatrixFailed) {
    recordRequirement(requirements, "lts-resume-matrix", "passed", resumeMatrixEvidence);
  } else {
    recordRequirement(
      requirements,
      "lts-resume-matrix",
      "failed",
      resumeMatrixEvidence,
      "one or more resume launch matrix checks did not return expected status",
    );
  }

  const lifecycleEvidence: string[] = [];
  let lifecycleFailed = false;
  let lifecycleActive = false;

  if (registrationId.length === 0) {
    recordRequirement(
      requirements,
      "lts-registration-waive",
      "failed",
      ["registrationId unavailable for waive"],
      "registration waive could not be attempted",
    );
    lifecycleEvidence.push("waive-repeat=>skipped:missing-registrationId");
    lifecycleEvidence.push("waived-launch=>skipped:missing-registrationId");
    lifecycleFailed = true;
  } else {
    lifecycleActive = true;
    let waivedAtValue: string | null = null;

    const waiveResponse = await callAdapterOperation("cmi5.registration.waive", waivePath, adapter.baseUrl, token, {
      registrationId,
    });

    const waiveBody = await parseObjectResponse(waiveResponse);
    const firstAlreadyWaived =
      waiveBody && typeof waiveBody.alreadyWaived === "boolean" ? waiveBody.alreadyWaived : null;
    waivedAtValue = waiveBody ? readStringField(waiveBody, "waivedAt") : null;

    if (waiveResponse.ok) {
      recordRequirement(requirements, "lts-registration-waive", "passed", ["cmi5.registration.waive returned success"]);
    } else {
      recordRequirement(
        requirements,
        "lts-registration-waive",
        "failed",
        [`cmi5.registration.waive status ${waiveResponse.status}`],
        "registration waive failed",
      );
    }

    const waiveRepeatResponse = await callAdapterOperation(
      "cmi5.registration.waive",
      waivePath,
      adapter.baseUrl,
      token,
      {
        registrationId,
      },
    );
    const waiveRepeatBody = await parseObjectResponse(waiveRepeatResponse);
    const repeatAlreadyWaived =
      waiveRepeatBody && typeof waiveRepeatBody.alreadyWaived === "boolean" ? waiveRepeatBody.alreadyWaived : null;
    const repeatWaivedAt = waiveRepeatBody ? readStringField(waiveRepeatBody, "waivedAt") : null;
    const waiveRepeatPassed =
      waiveRepeatResponse.ok &&
      firstAlreadyWaived === false &&
      repeatAlreadyWaived === true &&
      repeatWaivedAt === waivedAtValue;
    lifecycleEvidence.push(
      `waive-repeat=>status:${waiveRepeatResponse.status},firstAlready:${String(firstAlreadyWaived)},repeatAlready:${String(repeatAlreadyWaived)},waivedAtStable:${String(repeatWaivedAt === waivedAtValue)}`,
    );
    if (!waiveRepeatPassed) {
      lifecycleFailed = true;
    }

    const waivedLaunchResponse = await callAdapterOperation(
      "cmi5.launch.create",
      launchCreatePath,
      adapter.baseUrl,
      token,
      {
        packageId: importedPackageId,
        registrationId,
        learnerId: expectedLearnerId,
      },
    );
    const waivedLaunchBody = await parseObjectResponse(waivedLaunchResponse);
    const waivedRegistrationFlag =
      waivedLaunchBody && typeof waivedLaunchBody.waivedRegistration === "boolean"
        ? waivedLaunchBody.waivedRegistration
        : null;
    const waivedLaunchAt = waivedLaunchBody ? readStringField(waivedLaunchBody, "waivedAt") : null;
    const waivedLaunchPassed =
      waivedLaunchResponse.ok && waivedRegistrationFlag === true && waivedLaunchAt === waivedAtValue;
    lifecycleEvidence.push(
      `waived-launch=>status:${waivedLaunchResponse.status},waivedRegistration:${String(waivedRegistrationFlag)},waivedAtMatches:${String(waivedLaunchAt === waivedAtValue)}`,
    );
    if (!waivedLaunchPassed) {
      lifecycleFailed = true;
    }
  }

  if (sessionId.length === 0) {
    recordRequirement(
      requirements,
      "lts-session-abandon",
      "failed",
      ["sessionId unavailable for abandon"],
      "session abandon could not be attempted",
    );

    lifecycleEvidence.push("abandon-repeat=>skipped:missing-sessionId");
    lifecycleEvidence.push("abandoned-session-launch=>skipped:missing-sessionId");
    lifecycleFailed = true;
  } else {
    const abandonResponse = await callAdapterOperation("cmi5.session.abandon", abandonPath, adapter.baseUrl, token, {
      sessionId,
    });
    if (abandonResponse.ok) {
      recordRequirement(requirements, "lts-session-abandon", "passed", ["cmi5.session.abandon returned success"]);
    } else {
      recordRequirement(
        requirements,
        "lts-session-abandon",
        "failed",
        [`cmi5.session.abandon status ${abandonResponse.status}`],
        "session abandon failed",
      );
    }

    const repeatAbandonResponse = await callAdapterOperation(
      "cmi5.session.abandon",
      abandonPath,
      adapter.baseUrl,
      token,
      {
        sessionId,
      },
    );
    const repeatAbandonPassed = repeatAbandonResponse.status === 409;
    lifecycleEvidence.push(`abandon-repeat=>expected:409,actual:${repeatAbandonResponse.status}`);
    if (!repeatAbandonPassed) {
      lifecycleFailed = true;
    }

    const abandonedLaunchResponse = await callAdapterOperation(
      "cmi5.launch.create",
      launchCreatePath,
      adapter.baseUrl,
      token,
      {
        packageId: importedPackageId,
        sessionId,
        learnerId: expectedLearnerId,
      },
    );
    const abandonedLaunchPassed = abandonedLaunchResponse.status === 409;
    lifecycleEvidence.push(`abandoned-session-launch=>expected:409,actual:${abandonedLaunchResponse.status}`);
    if (!abandonedLaunchPassed) {
      lifecycleFailed = true;
    }
  }

  if (lifecycleActive) {
    if (!lifecycleFailed) {
      recordRequirement(requirements, "lts-lifecycle-state-matrix", "passed", lifecycleEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-lifecycle-state-matrix",
        "failed",
        lifecycleEvidence,
        "waive/abandon lifecycle state checks failed",
      );
    }
  }

  if (supportsDurableState) {
    const durableEvidence: string[] = [];
    let durableFailed = false;

    if (!stateReloadPath) {
      durableFailed = true;
      durableEvidence.push("stateReloadPathMissing=true");
    } else {
      const reloadResponse = await callAdapterOperation("cmi5.state.reload", stateReloadPath, adapter.baseUrl, token, {
        reason: "lts-durable-state-matrix",
      });
      const reloadBody = await parseObjectResponse(reloadResponse);
      const loaded = reloadBody && typeof reloadBody.loaded === "boolean" ? reloadBody.loaded : null;

      durableEvidence.push(`reloadStatus=${reloadResponse.status}`, `reloadLoaded=${String(loaded)}`);
      if (!reloadResponse.ok || loaded !== true) {
        durableFailed = true;
      }

      if (registrationId.length > 0) {
        const rewaiveResponse = await callAdapterOperation(
          "cmi5.registration.waive",
          waivePath,
          adapter.baseUrl,
          token,
          { registrationId },
        );
        const rewaiveBody = await parseObjectResponse(rewaiveResponse);
        const alreadyWaived =
          rewaiveBody && typeof rewaiveBody.alreadyWaived === "boolean" ? rewaiveBody.alreadyWaived : null;
        durableEvidence.push(`postReloadRewaiveStatus=${rewaiveResponse.status}`);
        durableEvidence.push(`postReloadRewaiveAlready=${String(alreadyWaived)}`);
        if (!rewaiveResponse.ok || alreadyWaived !== true) {
          durableFailed = true;
        }
      } else {
        durableEvidence.push("postReloadRewaive=skipped:missing-registrationId");
      }

      if (sessionId.length > 0) {
        const reabandonResponse = await callAdapterOperation(
          "cmi5.session.abandon",
          abandonPath,
          adapter.baseUrl,
          token,
          { sessionId },
        );
        durableEvidence.push(`postReloadReabandonStatus=${reabandonResponse.status}`);
        if (reabandonResponse.status !== 409) {
          durableFailed = true;
        }

        const postReloadLaunchResponse = await callAdapterOperation(
          "cmi5.launch.create",
          launchCreatePath,
          adapter.baseUrl,
          token,
          {
            packageId: importedPackageId,
            sessionId,
            learnerId: expectedLearnerId,
          },
        );
        durableEvidence.push(`postReloadAbandonedSessionLaunchStatus=${postReloadLaunchResponse.status}`);
        if (postReloadLaunchResponse.status !== 409) {
          durableFailed = true;
        }
      } else {
        durableEvidence.push("postReloadReabandon=skipped:missing-sessionId");
        durableEvidence.push("postReloadAbandonedSessionLaunch=skipped:missing-sessionId");
      }
    }

    if (!durableFailed) {
      recordRequirement(requirements, "lts-durable-state-matrix", "passed", durableEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-durable-state-matrix",
        "failed",
        durableEvidence,
        "one or more persistence reload checks failed",
      );
    }
  } else {
    recordRequirement(requirements, "lts-durable-state-matrix", "skipped", [
      "adapter did not advertise cmi5-durable-state optional feature",
    ]);
  }

  if (supportsCrossSystemIntegration && launchFetchPath && launchDataPath && statementPostPath && statementGetPath) {
    const crossSystemEvidence: string[] = [];
    let crossSystemFailed = false;

    const launchAResponse = await callAdapterOperation("cmi5.launch.create", launchCreatePath, adapter.baseUrl, token, {
      packageId: importedPackageId,
      learnerId: `${expectedLearnerId}.cross-a`,
      registrationId: `registration-cross-a-${runId}`,
      moveOn: "CompletedAndPassed",
    });
    const launchABody = await parseObjectResponse(launchAResponse);
    const sessionA = launchABody ? readStringField(launchABody, "sessionId") : null;
    const registrationA = launchABody ? readStringField(launchABody, "registrationId") : null;
    const fetchA = launchABody ? readStringField(launchABody, "fetch") : null;

    const launchBResponse = await callAdapterOperation("cmi5.launch.create", launchCreatePath, adapter.baseUrl, token, {
      packageId: importedPackageId,
      learnerId: `${expectedLearnerId}.cross-b`,
      registrationId: `registration-cross-b-${runId}`,
      moveOn: "CompletedAndPassed",
    });
    const launchBBody = await parseObjectResponse(launchBResponse);
    const sessionB = launchBBody ? readStringField(launchBBody, "sessionId") : null;
    const registrationB = launchBBody ? readStringField(launchBBody, "registrationId") : null;
    const fetchB = launchBBody ? readStringField(launchBBody, "fetch") : null;

    crossSystemEvidence.push(
      `launchAStatus=${launchAResponse.status}`,
      `launchBStatus=${launchBResponse.status}`,
      `distinctSessions=${String(sessionA !== null && sessionB !== null && sessionA !== sessionB)}`,
      `distinctRegistrations=${String(registrationA !== null && registrationB !== null && registrationA !== registrationB)}`,
    );

    const launchInputsReady =
      launchAResponse.ok &&
      launchBResponse.ok &&
      sessionA !== null &&
      sessionB !== null &&
      registrationA !== null &&
      registrationB !== null &&
      fetchA !== null &&
      fetchB !== null;

    if (!launchInputsReady) {
      crossSystemFailed = true;
    }

    if (launchInputsReady) {
      const sessionAId = sessionA;
      const sessionBId = sessionB;
      const registrationAId = registrationA;
      const registrationBId = registrationB;
      const fetchAUrl = fetchA;
      const fetchBUrl = fetchB;

      const launchAccessA = await exchangeLaunchAccess(fetchAUrl);
      const launchAccessB = await exchangeLaunchAccess(fetchBUrl);
      const authA = launchAccessA.authToken;
      const authB = launchAccessB.authToken;

      crossSystemEvidence.push(
        `fetchAStatus=${launchAccessA.status}`,
        `fetchBStatus=${launchAccessB.status}`,
        `authA=${String(authA !== null)}`,
        `authB=${String(authB !== null)}`,
      );

      if (!authA || !authB) {
        crossSystemFailed = true;
      } else {
        const postStatement = async (
          authToken: string,
          targetSessionId: string,
          targetRegistrationId: string,
          verb: string,
        ): Promise<number> => {
          const response = await fetch(new URL(statementPostPath, adapter.baseUrl), {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: authToken,
            },
            body: JSON.stringify({
              sessionId: targetSessionId,
              registrationId: targetRegistrationId,
              verb,
            }),
          });

          return response.status;
        };

        const bSequence = ["initialized", "launched", "completed", "passed", "terminated"];
        for (const verb of bSequence) {
          const status = await postStatement(authB, sessionBId, registrationBId, verb);
          crossSystemEvidence.push(`sessionB:${verb}=${status}`);
          if (status !== 200) {
            crossSystemFailed = true;
          }
        }

        const aInitStatus = await postStatement(authA, sessionAId, registrationAId, "initialized");
        const aLaunchStatus = await postStatement(authA, sessionAId, registrationAId, "launched");
        const aProgressStatus = await postStatement(authA, sessionAId, registrationAId, "progressed");
        crossSystemEvidence.push(
          `sessionA:initialized=${aInitStatus}`,
          `sessionA:launched=${aLaunchStatus}`,
          `sessionA:progressed=${aProgressStatus}`,
        );
        if (aInitStatus !== 200 || aLaunchStatus !== 200 || aProgressStatus !== 200) {
          crossSystemFailed = true;
        }

        const getStatementsAResponse = await fetch(
          new URL(`${statementGetPath}?sessionId=${encodeURIComponent(sessionAId)}`, adapter.baseUrl),
          {
            method: "GET",
            headers: { authorization: authA },
          },
        );
        const getStatementsBResponse = await fetch(
          new URL(`${statementGetPath}?sessionId=${encodeURIComponent(sessionBId)}`, adapter.baseUrl),
          {
            method: "GET",
            headers: { authorization: authB },
          },
        );
        const getStatementsABody = await parseObjectResponse(getStatementsAResponse);
        const getStatementsBBody = await parseObjectResponse(getStatementsBResponse);
        const statementsA = Array.isArray(getStatementsABody?.statements)
          ? (getStatementsABody?.statements as Array<Record<string, unknown>>)
          : [];
        const statementsB = Array.isArray(getStatementsBBody?.statements)
          ? (getStatementsBBody?.statements as Array<Record<string, unknown>>)
          : [];

        crossSystemEvidence.push(
          `getStatementsAStatus=${getStatementsAResponse.status}`,
          `getStatementsBStatus=${getStatementsBResponse.status}`,
          `statementCountA=${statementsA.length}`,
          `statementCountB=${statementsB.length}`,
        );

        if (getStatementsAResponse.status !== 200 || getStatementsBResponse.status !== 200) {
          crossSystemFailed = true;
        }

        if (statementsA.length !== 3 || statementsB.length !== 5) {
          crossSystemFailed = true;
        }

        const wrongAuthResponse = await fetch(
          new URL(`${statementGetPath}?sessionId=${encodeURIComponent(sessionAId)}`, adapter.baseUrl),
          {
            method: "GET",
            headers: { authorization: authB },
          },
        );
        crossSystemEvidence.push(`wrongAuthCrossSessionStatus=${wrongAuthResponse.status}`);
        if (wrongAuthResponse.status !== 401) {
          crossSystemFailed = true;
        }
      }
    }

    if (!crossSystemFailed) {
      recordRequirement(requirements, "lts-cross-system-integration-matrix", "passed", crossSystemEvidence);
    } else {
      recordRequirement(
        requirements,
        "lts-cross-system-integration-matrix",
        "failed",
        crossSystemEvidence,
        "cross-session isolation and interleaved lifecycle checks failed",
      );
    }
  } else {
    recordRequirement(requirements, "lts-cross-system-integration-matrix", "skipped", [
      "adapter did not advertise cmi5-cross-system-integration or required statement/fetch operations",
    ]);
  }

  const invalidOperationCases: Array<{
    label: string;
    path: string;
    payload: Record<string, unknown>;
    expectedStatus: number;
  }> = [
    {
      label: "waive-missing-registration-id",
      path: waivePath,
      payload: {},
      expectedStatus: 400,
    },
    {
      label: "waive-unknown-registration-id",
      path: waivePath,
      payload: { registrationId: "registration-missing" },
      expectedStatus: 404,
    },
    {
      label: "abandon-missing-session-id",
      path: abandonPath,
      payload: {},
      expectedStatus: 400,
    },
    {
      label: "abandon-unknown-session-id",
      path: abandonPath,
      payload: { sessionId: "missing-session" },
      expectedStatus: 404,
    },
  ];

  if (sessionId.length > 0) {
    invalidOperationCases.push({
      label: "abandon-already-abandoned-session-id",
      path: abandonPath,
      payload: { sessionId },
      expectedStatus: 409,
    });
  }

  const invalidOperationEvidence: string[] = [];
  let invalidOperationFailed = false;

  for (const testCase of invalidOperationCases) {
    const invalidResponse = await callAdapterOperation(
      "cmi5.operation",
      testCase.path,
      adapter.baseUrl,
      token,
      testCase.payload,
    );

    const passed = invalidResponse.status === testCase.expectedStatus;
    invalidOperationEvidence.push(
      `${testCase.label}=>expected:${testCase.expectedStatus},actual:${invalidResponse.status}`,
    );
    if (!passed) {
      invalidOperationFailed = true;
    }
  }

  if (!invalidOperationFailed) {
    recordRequirement(requirements, "lts-invalid-operation-matrix", "passed", invalidOperationEvidence);
  } else {
    recordRequirement(
      requirements,
      "lts-invalid-operation-matrix",
      "failed",
      invalidOperationEvidence,
      "one or more invalid waive/abandon payload checks did not return expected status",
    );
  }

  const finishedAtDate = new Date();
  const finishedAt = finishedAtDate.toISOString();
  const durationMs = Math.max(0, finishedAtDate.getTime() - startedAtDate.getTime());

  const requirementRecords = Object.values(requirements);
  const passedCount = requirementRecords.filter((record) => record.status === "passed").length;
  const failedCount = requirementRecords.filter((record) => record.status === "failed").length;
  const skippedCount = requirementRecords.filter((record) => record.status === "skipped").length;
  const resultStatus: "passed" | "failed" = failedCount === 0 ? "passed" : "failed";

  const summary = RunnerSummarySchema.parse({
    contractVersion: config.contractVersion,
    runner: {
      suite: "cmi5",
      version: cmi5RunnerVersion,
      profileVersion: adapter.profileVersion,
      target: config.suite.target,
    },
    startedAt,
    finishedAt,
    durationMs,
    result: {
      status: resultStatus,
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount,
    },
    adapter: {
      name: adapter.adapterName,
      version: adapter.adapterVersion,
      profileVersion: adapter.profileVersion,
    },
    artifacts: {
      summaryFile: config.artifacts.summaryFile,
      junitFile: config.artifacts.junitFile,
      requirementTraceFile: config.artifacts.requirementTraceFile,
      runMetadataFile: config.artifacts.runMetadataFile,
    },
  });

  const requirementTrace = RequirementTraceSchema.parse({
    contractVersion: config.contractVersion,
    runId,
    requirements,
  });

  const runMetadata = RunMetadataSchema.parse({
    runId,
    startedAt,
    finishedAt,
    image: {
      reference: "ghcr.io/conform-ed/cmi5-runner:local",
      digest: "sha256:local",
      source: "workspace",
    },
    standards: {
      suiteSourceRevision: "catapult-lts-baseline",
      requirementsRevision: "catapult-lts-baseline",
      profileVersion: adapter.profileVersion,
    },
    runner: {
      version: cmi5RunnerVersion,
      revision: process.env.CONFORM_ED_RUNNER_REVISION?.trim() || "local",
    },
  });

  const junitXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="cmi5-lts" tests="${requirementRecords.length}" failures="${failedCount}" skipped="${skippedCount}">`,
    ...Object.entries(requirements).map(([requirementId, record]) => {
      if (record.status === "passed") {
        return `  <testcase classname="cmi5.lts" name="${requirementId}"/>`;
      }

      const message = (record.message ?? "requirement check failed").replaceAll("&", "&amp;").replaceAll("<", "&lt;");
      return [
        `  <testcase classname="cmi5.lts" name="${requirementId}">`,
        `    <failure message="${message}"/>`,
        "  </testcase>",
      ].join("\n");
    }),
    "</testsuite>",
  ].join("\n");

  await mkdir(outputDir, { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(requirementTracePath, `${JSON.stringify(requirementTrace, null, 2)}\n`, "utf8");
  await writeFile(runMetadataPath, `${JSON.stringify(runMetadata, null, 2)}\n`, "utf8");
  await writeFile(junitPath, `${junitXml}\n`, "utf8");
  await writeFile(catapultParityPath, `${JSON.stringify(buildCatapultParityLedger(requirements), null, 2)}\n`, "utf8");

  return {
    status: "completed",
    execution: "executed",
    runId,
    startedAt,
    finishedAt,
    durationMs,
    result: {
      status: resultStatus,
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount,
    },
    artifacts: {
      outputDir,
      summaryFile: summaryPath,
      junitFile: junitPath,
      requirementTraceFile: requirementTracePath,
      runMetadataFile: runMetadataPath,
      catapultParityFile: catapultParityPath,
    },
    adapter,
  };
}

export async function validateCmi5Config(configPath: string): Promise<ValidateCmi5ConfigResult> {
  const result = await runPreflight(configPath);

  if (result.status === "preflight_passed") {
    return {
      valid: true,
      code: "ok",
      adapter: result.adapter,
    };
  }

  return {
    valid: false,
    code: result.code,
    message: result.message,
    details: result.details,
  };
}
