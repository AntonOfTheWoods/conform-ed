import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type ParsedArgs = {
  composeFile: string;
  composeProjectName: string;
  keepStack: boolean;
  localPort: number;
  mode: "local" | "external";
  passthrough: string[];
  readinessTimeoutMs: number;
  toolBaseUrl: string;
  toolJwksUrl: string | null;
  toolLoginInitiationUrl: string | null;
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultComposeFile = resolve(repoRoot, "infra", "compose", "podman-compose.lti13-oss-tool-ltijs.yaml");

function runCommand(command: string, args: string[]): number {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function parsePort(rawValue: string, flag: string): number {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${flag} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]?.trim();
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    composeFile: process.env.LTI13_INTEROP_LTIJS_COMPOSE_FILE?.trim() || defaultComposeFile,
    composeProjectName: process.env.LTI13_INTEROP_LTIJS_PROJECT_NAME?.trim() || "conform-ed-lti13-interop-ltijs",
    keepStack: false,
    localPort: parsePort(process.env.LTI13_INTEROP_LTIJS_PORT?.trim() || "15610", "LTI13_INTEROP_LTIJS_PORT"),
    mode: "local",
    passthrough: [],
    readinessTimeoutMs: 60_000,
    toolBaseUrl: process.env.LTIJS_BASE_URL?.trim() || "",
    toolJwksUrl: process.env.LTIJS_JWKS_URL?.trim() || null,
    toolLoginInitiationUrl: process.env.LTIJS_LOGIN_URL?.trim() || null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--mode": {
        const value = readFlagValue(argv, index, arg);
        if (value !== "local" && value !== "external") {
          throw new Error("--mode must be one of: local, external.");
        }
        parsed.mode = value;
        index += 1;
        break;
      }
      case "--compose-file":
        parsed.composeFile = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      case "--compose-project-name":
        parsed.composeProjectName = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--local-port":
        parsed.localPort = parsePort(readFlagValue(argv, index, arg), arg);
        index += 1;
        break;
      case "--keep-stack":
        parsed.keepStack = true;
        break;
      case "--readiness-timeout-ms": {
        const value = Number.parseInt(readFlagValue(argv, index, arg), 10);
        if (!Number.isInteger(value) || value < 1000) {
          throw new Error("--readiness-timeout-ms must be an integer >= 1000.");
        }
        parsed.readinessTimeoutMs = value;
        index += 1;
        break;
      }
      case "--tool-base-url":
        parsed.toolBaseUrl = readFlagValue(argv, index, arg);
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
      case "--help":
        console.log(
          `Usage: bun run scripts/run-lti13-interop-oss-tool-ltijs.ts [options] [-- <interop args>]\n\nOptions:\n  --mode <local|external>            Local compose mode (default) or external URLs\n  --tool-base-url <url>              LTI.js base URL (required in external mode; defaults to local fixture URL in local mode)\n  --tool-login-initiation-url <url>  Override login initiation URL (default: <base>/login)\n  --tool-jwks-url <url>              Override JWKS URL (default: <base>/keys)\n  --compose-file <path>              Compose file for local mode\n  --compose-project-name <name>      Compose project name for local mode\n  --local-port <port>                Local fixture port (default: 15610)\n  --readiness-timeout-ms <ms>        Readiness timeout for local fixture (default: 60000)\n  --keep-stack                       Keep local fixture stack running after the lane finishes\n  --help                             Show help\n\nAny additional args are passed through to scripts/run-lti13-interop-lane.ts.\n`,
        );
        process.exit(0);
      default:
        parsed.passthrough.push(arg);
        break;
    }
  }

  if (parsed.mode === "external" && !parsed.toolBaseUrl && (!parsed.toolJwksUrl || !parsed.toolLoginInitiationUrl)) {
    throw new Error(
      "Provide --tool-base-url <url> (or LTIJS_BASE_URL), or pass both --tool-login-initiation-url and --tool-jwks-url when --mode external.",
    );
  }

  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Continue polling.
    }
    await Bun.sleep(250);
  }

  throw new Error(`Timed out waiting for LTI.js fixture readiness at ${url}.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const localBaseUrl = `http://127.0.0.1:${args.localPort}`;
  const baseUrl = trimTrailingSlash(args.toolBaseUrl || localBaseUrl);
  const loginUrl = args.toolLoginInitiationUrl ?? `${baseUrl}/login`;
  const jwksUrl = args.toolJwksUrl ?? `${baseUrl}/keys`;

  if (args.mode === "local") {
    const upStatus = runCommand("podman", [
      "compose",
      "-f",
      args.composeFile,
      "-p",
      args.composeProjectName,
      "up",
      "-d",
    ]);

    if (upStatus !== 0) {
      process.exitCode = upStatus;
      return;
    }

    try {
      await waitForReady(`${localBaseUrl}/keys`, args.readinessTimeoutMs);
    } catch (error) {
      if (!args.keepStack) {
        runCommand("podman", ["compose", "-f", args.composeFile, "-p", args.composeProjectName, "down", "-v"]);
      }
      throw error;
    }
  }

  let laneStatus = 0;
  try {
    laneStatus = runCommand("bun", [
      "run",
      "scripts/run-lti13-interop-lane.ts",
      "--interop-profile",
      "oss-tool",
      "--role",
      "platform",
      "--tool-login-initiation-url",
      loginUrl,
      "--tool-jwks-url",
      jwksUrl,
      ...args.passthrough,
    ]);
  } finally {
    if (args.mode === "local" && !args.keepStack) {
      runCommand("podman", ["compose", "-f", args.composeFile, "-p", args.composeProjectName, "down", "-v"]);
    }
  }

  if (laneStatus !== 0) {
    process.exitCode = laneStatus;
  }
}

await main();
