import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AdapterCapabilitySchema, AdapterProfileSchema, RunnerConfigSchema } from "@conform-ed/contracts";
import { callAdapterOperation, fetchAdapterCapabilities, fetchAdapterProfile } from "./adapter-client";
import { lti13Targets } from "./targets";

const requiredLti13Operations = [
  "lti.registration.resolve",
  "lti.login.initiation",
  "lti.launch.create",
  "lti.deep-link.create",
  "lti.ags.line-items",
  "lti.ags.scores",
  "lti.nrps.memberships",
] as const;

type RunLti13Success = {
  status: "execution_passed";
  execution: "matrix_passed";
  adapter: {
    baseUrl: string;
    adapterName: string;
    adapterVersion: string;
    profileVersion: string;
  };
  target: string;
  checks: Array<{
    requirementId: string;
    operation: string;
    status: number;
  }>;
};

type RunLti13Failure = {
  status: "error";
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type RunLti13Result = RunLti13Success | RunLti13Failure;

export type ValidateLti13ConfigResult =
  | {
      valid: true;
      code: "ok";
      adapter: RunLti13Success["adapter"];
    }
  | {
      valid: false;
      code: RunLti13Failure["code"];
      message: string;
      details?: Record<string, unknown> | undefined;
    };

type ExecutableOperation = {
  operation: (typeof requiredLti13Operations)[number];
  requirementId: string;
  requestBody?: Record<string, unknown>;
};

type Lti13Target = (typeof lti13Targets)[number];

const matrixByTarget: Record<Lti13Target, ExecutableOperation[]> = {
  "core-launch": [
    {
      operation: "lti.registration.resolve",
      requirementId: "lts-lti13-001",
      requestBody: {
        issuer: "https://example.platform",
        clientId: "client-123",
        deploymentId: "deployment-123",
      },
    },
    {
      operation: "lti.login.initiation",
      requirementId: "lts-lti13-002",
      requestBody: {
        issuer: "https://example.platform",
        loginHint: "student-123",
        targetLinkUri: "https://tool.example/launch",
      },
    },
    {
      operation: "lti.launch.create",
      requirementId: "lts-lti13-003",
      requestBody: {
        messageType: "LtiResourceLinkRequest",
        contextId: "course-123",
        resourceLinkId: "resource-123",
      },
    },
  ],
  "deep-linking": [
    {
      operation: "lti.deep-link.create",
      requirementId: "lts-lti13-004",
      requestBody: {
        returnUrl: "https://platform.example/deep-link/return",
        resources: [
          {
            type: "ltiResourceLink",
            title: "Example Link",
            url: "https://tool.example/content/alpha",
          },
        ],
      },
    },
  ],
  ags: [
    {
      operation: "lti.ags.line-items",
      requirementId: "lts-lti13-005",
      requestBody: {
        label: "Example Grade",
        scoreMaximum: 100,
      },
    },
    {
      operation: "lti.ags.scores",
      requirementId: "lts-lti13-006",
      requestBody: {
        userId: "student-123",
        scoreGiven: 85,
        scoreMaximum: 100,
      },
    },
  ],
  nrps: [
    {
      operation: "lti.nrps.memberships",
      requirementId: "lts-lti13-007",
    },
  ],
};

async function readConfig(configPath: string): Promise<unknown> {
  const payload = await readFile(resolve(process.cwd(), configPath), "utf8");
  return JSON.parse(payload);
}

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

function missingRequiredOperations(operations: string[]): string[] {
  return requiredLti13Operations.filter((operation) => !operations.includes(operation));
}

function operationsForTarget(target: string): ExecutableOperation[] {
  const configuredTargets = new Set(lti13Targets);

  if (configuredTargets.has(target as Lti13Target)) {
    return matrixByTarget[target as Lti13Target];
  }

  return [
    ...matrixByTarget["core-launch"],
    ...matrixByTarget["deep-linking"],
    ...matrixByTarget.ags,
    ...matrixByTarget.nrps,
  ];
}

function operationPathMap(
  operations: Array<{ name: string; path: string; method: "GET" | "POST" }>,
): Map<string, string> {
  return new Map(operations.map((operation) => [operation.name, operation.path]));
}

export async function runLti13(configPath: string): Promise<RunLti13Result> {
  try {
    const config = RunnerConfigSchema.parse(await readConfig(configPath));
    if (config.suite.name !== "lti13" || !config.adapter) {
      return {
        status: "error",
        code: "invalid_suite",
        message: "lti13 runner requires an lti13 suite config with adapter",
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

    if (profile.suite !== "lti13") {
      return {
        status: "error",
        code: "adapter_profile_suite_mismatch",
        message: "adapter profile suite must be lti13",
      };
    }

    const profileOperationNames = profile.operations.map((operation) => operation.name);
    const missingProfileOperations = missingRequiredOperations(profileOperationNames);
    if (missingProfileOperations.length > 0) {
      return {
        status: "error",
        code: "adapter_profile_operations_missing",
        message: "adapter profile does not declare all required lti13 operations",
        details: { missingOperations: missingProfileOperations },
      };
    }

    const missingCapabilities = missingRequiredOperations(capabilities.operations);
    if (missingCapabilities.length > 0) {
      return {
        status: "error",
        code: "adapter_operations_missing",
        message: "adapter does not declare all required lti13 operations",
        details: { missingOperations: missingCapabilities },
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

    const targetOperationChecks = operationsForTarget(config.suite.target);
    const pathByOperation = operationPathMap(profile.operations);
    const checks: RunLti13Success["checks"] = [];

    for (const check of targetOperationChecks) {
      const operationPath = pathByOperation.get(check.operation);

      if (!operationPath) {
        return {
          status: "error",
          code: "adapter_profile_path_missing",
          message: "adapter profile is missing an operation path",
          details: {
            operation: check.operation,
            requirementId: check.requirementId,
          },
        };
      }

      const method = check.requestBody === undefined ? "GET" : "POST";
      const operationResponse = await callAdapterOperation(
        config.adapter.baseUrl,
        operationPath,
        method,
        token,
        check.requestBody,
      );

      if (!operationResponse.ok) {
        return {
          status: "error",
          code: "lti_operation_failed",
          message: "lti verifier operation failed",
          details: {
            operation: check.operation,
            requirementId: check.requirementId,
            path: operationPath,
            status: operationResponse.status,
          },
        };
      }

      checks.push({
        requirementId: check.requirementId,
        operation: check.operation,
        status: operationResponse.status,
      });
    }

    return {
      status: "execution_passed",
      execution: "matrix_passed",
      adapter: {
        baseUrl: config.adapter.baseUrl,
        adapterName: capabilities.adapterName,
        adapterVersion: capabilities.adapterVersion,
        profileVersion: profile.profileVersion,
      },
      target: config.suite.target,
      checks,
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

export async function validateLti13Config(configPath: string): Promise<ValidateLti13ConfigResult> {
  const result = await runLti13(configPath);

  if (result.status === "execution_passed") {
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
