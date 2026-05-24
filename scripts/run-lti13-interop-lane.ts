import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

type LtiTarget = "all" | "core-launch" | "deep-linking" | "ags" | "nrps";
type LtiRole = "tool" | "platform" | "both";
type InteropProfile = "local-reference" | "oss-platform" | "oss-tool";

type ParsedArgs = {
  adapterBaseUrl: string | null;
  adapterPort: number;
  adapterToken: string;
  expectedAdapterName: string | null;
  interopProfile: InteropProfile;
  keepAdapter: boolean;
  outputDir: string;
  platformIssuer: string | null;
  platformOpenIdConfigurationUrl: string | null;
  readinessTimeoutMs: number;
  reportFile: string;
  role: LtiRole;
  toolJwksUrl: string | null;
  toolLoginInitiationUrl: string | null;
  target: LtiTarget;
};

type RunnerParsedStatus = {
  adapter?: {
    adapterName?: unknown;
  };
  checks?: unknown;
  execution?: unknown;
  status?: unknown;
  target?: unknown;
};

type InteropLaneReport = {
  adapterBaseUrl: string;
  adapterReady: boolean;
  adapterStart: {
    pid: number | null;
  };
  endedAt: string;
  interopProfile: InteropProfile;
  outputDir: string;
  reportFile: string;
  role: LtiRole;
  runner: {
    exitCode: number | null;
    parsedResult: unknown;
    stderr: string;
    stdout: string;
  };
  startedAt: string;
  status: "passed" | "failed";
  interopChecks: Array<{
    detail: string;
    id: string;
    status: "passed" | "failed";
  }>;
  summary: {
    checksFailed: number;
    checksPassed: number;
    checksTotal: number;
    interopFailed: number;
    interopPassed: number;
    interopTotal: number;
    target: LtiTarget;
  };
};

type InteropCheck = {
  detail: string;
  id: string;
  status: "passed" | "failed";
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultOutputDir = resolve(repoRoot, "tmp", "agents", `lti13-interop-${Date.now()}`);

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]?.trim();
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function parsePort(rawValue: string, flag: string): number {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${flag} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

function parseTarget(rawValue: string, flag: string): LtiTarget {
  if (
    rawValue === "all" ||
    rawValue === "core-launch" ||
    rawValue === "deep-linking" ||
    rawValue === "ags" ||
    rawValue === "nrps"
  ) {
    return rawValue;
  }

  throw new Error(`${flag} must be one of: all, core-launch, deep-linking, ags, nrps.`);
}

function parseRole(rawValue: string, flag: string): LtiRole {
  if (rawValue === "tool" || rawValue === "platform" || rawValue === "both") {
    return rawValue;
  }

  throw new Error(`${flag} must be one of: tool, platform, both.`);
}

function parseInteropProfile(rawValue: string, flag: string): InteropProfile {
  if (rawValue === "local-reference" || rawValue === "oss-platform" || rawValue === "oss-tool") {
    return rawValue;
  }

  throw new Error(`${flag} must be one of: local-reference, oss-platform, oss-tool.`);
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    adapterBaseUrl: null,
    adapterPort: 4600,
    adapterToken: "conform-ed-lti13-interop-token",
    expectedAdapterName: null,
    interopProfile: "local-reference",
    keepAdapter: false,
    outputDir: defaultOutputDir,
    platformIssuer: null,
    platformOpenIdConfigurationUrl: null,
    readinessTimeoutMs: 20_000,
    reportFile: resolve(defaultOutputDir, "interop-lane-report.json"),
    role: "both",
    toolJwksUrl: null,
    toolLoginInitiationUrl: null,
    target: "all",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--adapter-port":
        parsed.adapterPort = parsePort(readFlagValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--adapter-base-url":
        parsed.adapterBaseUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--adapter-token":
        parsed.adapterToken = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--expected-adapter-name":
        parsed.expectedAdapterName = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--target":
        parsed.target = parseTarget(readFlagValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--role":
        parsed.role = parseRole(readFlagValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--interop-profile":
        parsed.interopProfile = parseInteropProfile(readFlagValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--platform-openid-configuration-url":
        parsed.platformOpenIdConfigurationUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--platform-issuer":
        parsed.platformIssuer = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--tool-login-initiation-url":
        parsed.toolLoginInitiationUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--tool-jwks-url":
        parsed.toolJwksUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--output-dir":
        parsed.outputDir = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      case "--report-file":
        parsed.reportFile = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      case "--readiness-timeout-ms": {
        const rawValue = readFlagValue(argv, index, arg);
        const parsedTimeout = Number.parseInt(rawValue, 10);
        if (!Number.isInteger(parsedTimeout) || parsedTimeout < 1000) {
          throw new Error("--readiness-timeout-ms must be an integer >= 1000.");
        }
        parsed.readinessTimeoutMs = parsedTimeout;
        index += 1;
        break;
      }
      case "--keep-adapter":
        parsed.keepAdapter = true;
        break;
      case "--help":
        console.log(
          `Usage: bun run scripts/run-lti13-interop-lane.ts [options]\n\nOptions:\n  --target <all|core-launch|deep-linking|ags|nrps>  LTI module target (default: all)\n  --role <tool|platform|both>                        Interop role under evaluation (default: both)\n  --interop-profile <local-reference|oss-platform|oss-tool>\n                                                   Interop scenario profile (default: local-reference)\n  --platform-openid-configuration-url <url>          Required for oss-platform profile\n  --platform-issuer <issuer>                         Optional issuer assertion for oss-platform profile\n  --tool-login-initiation-url <url>                  Required for oss-tool profile\n  --tool-jwks-url <url>                              Required for oss-tool profile\n  --adapter-port <port>                              Adapter port when launching reference adapter (default: 4600)\n  --adapter-base-url <url>                           Use an already running adapter URL\n  --adapter-token <token>                            Adapter bearer token\n  --expected-adapter-name <name>                     Require runner output adapter.adapterName to match\n  --output-dir <path>                                Artifact directory under repo (default: tmp/agents/...)\n  --report-file <path>                               Report file path under repo\n  --readiness-timeout-ms <ms>                        Adapter readiness timeout\n  --keep-adapter                                     Keep spawned reference adapter process running after lane\n  --help                                             Show help\n`,
        );
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!parsed.reportFile.startsWith(resolve(repoRoot, "tmp") + "/")) {
    throw new Error("--report-file must be under tmp/");
  }

  if (!parsed.outputDir.startsWith(resolve(repoRoot, "tmp") + "/")) {
    throw new Error("--output-dir must be under tmp/");
  }

  if (parsed.interopProfile === "oss-platform" && !parsed.platformOpenIdConfigurationUrl) {
    throw new Error("--platform-openid-configuration-url is required for --interop-profile oss-platform.");
  }

  if (parsed.interopProfile === "oss-tool" && !parsed.toolLoginInitiationUrl) {
    throw new Error("--tool-login-initiation-url is required for --interop-profile oss-tool.");
  }

  if (parsed.interopProfile === "oss-tool" && !parsed.toolJwksUrl) {
    throw new Error("--tool-jwks-url is required for --interop-profile oss-tool.");
  }

  return parsed;
}

async function waitForAdapter(baseUrl: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Continue retrying until timeout.
    }

    await Bun.sleep(250);
  }

  return false;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function summarizeChecks(rawChecks: unknown): { passed: number; failed: number; total: number } {
  if (!Array.isArray(rawChecks)) {
    return { passed: 0, failed: 0, total: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const check of rawChecks) {
    const status =
      check && typeof check === "object" && "status" in check && typeof check.status === "number" ? check.status : 0;
    if (status >= 200 && status < 300) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  return { passed, failed, total: rawChecks.length };
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function isHttpSuccess(status: number): boolean {
  return status >= 200 && status < 400;
}

function checkResult(id: string, status: "passed" | "failed", detail: string): InteropCheck {
  return { id, status, detail };
}

export async function runOssPlatformChecks(args: ParsedArgs): Promise<InteropCheck[]> {
  const checks: InteropCheck[] = [];

  if (args.role === "platform") {
    checks.push(
      checkResult(
        "profile.role.compatibility",
        "failed",
        "oss-platform profile expects role tool or both because counterpart is an external platform.",
      ),
    );
    return checks;
  }

  const openIdConfigUrl = args.platformOpenIdConfigurationUrl as string;
  let openIdConfigResponse: Response;

  try {
    openIdConfigResponse = await fetch(openIdConfigUrl);
  } catch (error) {
    checks.push(
      checkResult(
        "oss-platform.openid-configuration.reachable",
        "failed",
        `Unable to fetch platform OpenID configuration: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return checks;
  }

  if (!isHttpSuccess(openIdConfigResponse.status)) {
    checks.push(
      checkResult(
        "oss-platform.openid-configuration.reachable",
        "failed",
        `Platform OpenID configuration endpoint returned HTTP ${openIdConfigResponse.status}.`,
      ),
    );
    return checks;
  }

  checks.push(
    checkResult(
      "oss-platform.openid-configuration.reachable",
      "passed",
      `Platform OpenID configuration endpoint reachable (${openIdConfigResponse.status}).`,
    ),
  );

  let openIdConfigJson: unknown;
  try {
    openIdConfigJson = await openIdConfigResponse.json();
  } catch {
    checks.push(checkResult("oss-platform.openid-configuration.json", "failed", "OpenID configuration is not JSON."));
    return checks;
  }

  const openIdConfig = parseJsonObject(openIdConfigJson);
  if (!openIdConfig) {
    checks.push(
      checkResult("oss-platform.openid-configuration.shape", "failed", "OpenID configuration must be an object."),
    );
    return checks;
  }

  const issuer = typeof openIdConfig.issuer === "string" ? openIdConfig.issuer : null;
  const jwksUri = typeof openIdConfig.jwks_uri === "string" ? openIdConfig.jwks_uri : null;
  const authEndpoint =
    typeof openIdConfig.authorization_endpoint === "string" ? openIdConfig.authorization_endpoint : null;

  checks.push(
    checkResult(
      "oss-platform.openid-configuration.required-fields",
      issuer && jwksUri && authEndpoint ? "passed" : "failed",
      issuer && jwksUri && authEndpoint
        ? "OpenID configuration includes issuer, jwks_uri, and authorization_endpoint."
        : "OpenID configuration is missing issuer, jwks_uri, or authorization_endpoint.",
    ),
  );

  if (args.platformIssuer) {
    checks.push(
      checkResult(
        "oss-platform.issuer.match",
        issuer === args.platformIssuer ? "passed" : "failed",
        issuer === args.platformIssuer
          ? "Platform issuer matches expected issuer."
          : `Platform issuer mismatch. expected=${args.platformIssuer}, actual=${issuer ?? "missing"}`,
      ),
    );
  }

  if (!jwksUri) {
    return checks;
  }

  let jwksResponse: Response;
  try {
    jwksResponse = await fetch(jwksUri);
  } catch (error) {
    checks.push(
      checkResult(
        "oss-platform.jwks.reachable",
        "failed",
        `Unable to fetch platform JWKS: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return checks;
  }

  if (!isHttpSuccess(jwksResponse.status)) {
    checks.push(
      checkResult(
        "oss-platform.jwks.reachable",
        "failed",
        `Platform JWKS endpoint returned HTTP ${jwksResponse.status}.`,
      ),
    );
    return checks;
  }

  checks.push(
    checkResult("oss-platform.jwks.reachable", "passed", `Platform JWKS endpoint reachable (${jwksResponse.status}).`),
  );

  try {
    const jwksJson = await jwksResponse.json();
    const jwks = parseJsonObject(jwksJson);
    const keys = jwks?.keys;
    const keysValid = Array.isArray(keys) && keys.length > 0;
    checks.push(
      checkResult(
        "oss-platform.jwks.keys",
        keysValid ? "passed" : "failed",
        keysValid
          ? "Platform JWKS contains at least one key."
          : "Platform JWKS did not contain a non-empty keys array.",
      ),
    );
  } catch {
    checks.push(checkResult("oss-platform.jwks.json", "failed", "Platform JWKS response is not valid JSON."));
  }

  return checks;
}

export async function runOssToolChecks(args: ParsedArgs): Promise<InteropCheck[]> {
  const checks: InteropCheck[] = [];

  if (args.role === "tool") {
    checks.push(
      checkResult(
        "profile.role.compatibility",
        "failed",
        "oss-tool profile expects role platform or both because counterpart is an external tool.",
      ),
    );
    return checks;
  }

  const loginUrl = new URL(args.toolLoginInitiationUrl as string);
  loginUrl.searchParams.set("iss", "https://platform.example");
  loginUrl.searchParams.set("login_hint", "interop-user-1");
  loginUrl.searchParams.set("target_link_uri", "https://tool.example/launch");
  loginUrl.searchParams.set("lti_message_hint", "resource-123");
  loginUrl.searchParams.set("client_id", "interop-client-1");

  try {
    const loginResponse = await fetch(loginUrl);
    const loginReachable = loginResponse.status < 500;
    checks.push(
      checkResult(
        "oss-tool.login-initiation.reachable",
        loginReachable ? "passed" : "failed",
        loginReachable
          ? `Tool login initiation endpoint reachable (${loginResponse.status}).`
          : `Tool login initiation endpoint returned server error HTTP ${loginResponse.status}.`,
      ),
    );
  } catch (error) {
    checks.push(
      checkResult(
        "oss-tool.login-initiation.reachable",
        "failed",
        `Unable to fetch tool login initiation endpoint: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }

  try {
    const jwksResponse = await fetch(args.toolJwksUrl as string);
    checks.push(
      checkResult(
        "oss-tool.jwks.reachable",
        isHttpSuccess(jwksResponse.status) ? "passed" : "failed",
        isHttpSuccess(jwksResponse.status)
          ? `Tool JWKS endpoint reachable (${jwksResponse.status}).`
          : `Tool JWKS endpoint returned HTTP ${jwksResponse.status}.`,
      ),
    );

    if (isHttpSuccess(jwksResponse.status)) {
      try {
        const jwksJson = await jwksResponse.json();
        const jwks = parseJsonObject(jwksJson);
        const keys = jwks?.keys;
        const keysValid = Array.isArray(keys);
        checks.push(
          checkResult(
            "oss-tool.jwks.keys",
            keysValid ? "passed" : "failed",
            keysValid
              ? `Tool JWKS contains a keys array (${keys.length} key(s)).`
              : "Tool JWKS did not contain a keys array.",
          ),
        );
      } catch {
        checks.push(checkResult("oss-tool.jwks.json", "failed", "Tool JWKS response is not valid JSON."));
      }
    }
  } catch (error) {
    checks.push(
      checkResult(
        "oss-tool.jwks.reachable",
        "failed",
        `Unable to fetch tool JWKS endpoint: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }

  return checks;
}

export async function runInteropChecks(args: ParsedArgs): Promise<InteropCheck[]> {
  if (args.interopProfile === "local-reference") {
    return [
      checkResult(
        "profile.local-reference",
        "passed",
        "Local reference profile selected; no external counterpart checks required.",
      ),
    ];
  }

  if (args.interopProfile === "oss-platform") {
    return runOssPlatformChecks(args);
  }

  return runOssToolChecks(args);
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  mkdirSync(args.outputDir, { recursive: true });

  const configPath = resolve(args.outputDir, `lti13.interop.${args.target}.config.json`);
  const adapterBaseUrl = args.adapterBaseUrl ?? `http://127.0.0.1:${args.adapterPort}`;

  const configPayload = {
    contractVersion: "1.0.0",
    suite: { name: "lti13", target: args.target },
    sut: {
      publicUrls: {
        tool: "http://127.0.0.1:4401",
      },
    },
    artifacts: {
      outputDir: resolve(args.outputDir, "runner-artifacts"),
    },
    adapter: {
      kind: "http",
      baseUrl: adapterBaseUrl,
      auth: {
        mode: "bearer",
        tokenFromEnv: "CONFORM_ED_ADAPTER_TOKEN",
      },
    },
  };
  writeJson(configPath, configPayload);

  const adapterProcess =
    args.adapterBaseUrl === null
      ? spawn("bun", ["--cwd", "apps/lti13-adapter-reference", "src/index.ts"], {
          cwd: repoRoot,
          env: {
            ...process.env,
            PORT: String(args.adapterPort),
            ADAPTER_AUTH_TOKEN: args.adapterToken,
          },
          stdio: "inherit",
        })
      : null;

  const adapterReady = await waitForAdapter(adapterBaseUrl, args.readinessTimeoutMs);

  let runnerStdout = "";
  let runnerStderr = "";
  let runnerExitCode: number | null = null;
  let parsedResult: unknown = null;

  if (adapterReady) {
    const runnerResult = spawnSync(
      "bun",
      ["--cwd", "apps/lti13-runner", "src/index.ts", "run", "--config", configPath],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          CONFORM_ED_ADAPTER_TOKEN: args.adapterToken,
        },
        encoding: "utf8",
      },
    );

    runnerStdout = runnerResult.stdout ?? "";
    runnerStderr = runnerResult.stderr ?? "";
    runnerExitCode = runnerResult.status;

    try {
      parsedResult = JSON.parse(runnerStdout);
    } catch {
      parsedResult = null;
    }
  }

  if (!args.keepAdapter && adapterProcess) {
    adapterProcess.kill("SIGTERM");
  }

  const parsedStatus =
    parsedResult && typeof parsedResult === "object" ? ((parsedResult as RunnerParsedStatus).status ?? null) : null;
  const parsedExecution =
    parsedResult && typeof parsedResult === "object" ? ((parsedResult as RunnerParsedStatus).execution ?? null) : null;
  const parsedAdapterName =
    parsedResult && typeof parsedResult === "object"
      ? ((parsedResult as RunnerParsedStatus).adapter?.adapterName ?? null)
      : null;
  const checksSummary =
    parsedResult && typeof parsedResult === "object"
      ? summarizeChecks((parsedResult as RunnerParsedStatus).checks)
      : { passed: 0, failed: 0, total: 0 };
  const interopChecks = await runInteropChecks(args);
  const interopPassed = interopChecks.filter((check) => check.status === "passed").length;
  const interopFailed = interopChecks.length - interopPassed;

  const adapterNameMatched =
    args.expectedAdapterName === null ||
    (typeof parsedAdapterName === "string" && parsedAdapterName === args.expectedAdapterName);

  const status: "passed" | "failed" =
    adapterReady &&
    runnerExitCode === 0 &&
    parsedStatus === "execution_passed" &&
    parsedExecution === "matrix_passed" &&
    interopFailed === 0 &&
    adapterNameMatched
      ? "passed"
      : "failed";

  const report: InteropLaneReport = {
    adapterBaseUrl,
    adapterReady,
    adapterStart: {
      pid: adapterProcess?.pid ?? null,
    },
    endedAt: new Date().toISOString(),
    interopProfile: args.interopProfile,
    outputDir: args.outputDir,
    reportFile: args.reportFile,
    role: args.role,
    runner: {
      exitCode: runnerExitCode,
      parsedResult,
      stderr: runnerStderr,
      stdout: runnerStdout,
    },
    startedAt,
    status,
    interopChecks,
    summary: {
      checksFailed: checksSummary.failed,
      checksPassed: checksSummary.passed,
      checksTotal: checksSummary.total,
      interopFailed,
      interopPassed,
      interopTotal: interopChecks.length,
      target: args.target,
    },
  };

  writeJson(args.reportFile, report);
  console.log(JSON.stringify(report, null, 2));

  if (status !== "passed") {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await run();
}
