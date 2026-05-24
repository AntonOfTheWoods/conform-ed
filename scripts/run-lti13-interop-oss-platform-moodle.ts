import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type ParsedArgs = {
  adminEmail: string;
  adminPassword: string;
  adminUsername: string;
  moodleBranch: string;
  composeFile: string;
  composeProjectName: string;
  keepStack: boolean;
  localPort: number;
  mode: "local" | "external";
  issuer: string | null;
  moodleBaseUrl: string;
  passthrough: string[];
  readinessTimeoutMs: number;
  siteFullName: string;
  siteShortName: string;
  siteSummary: string;
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultComposeFile = resolve(repoRoot, "infra", "compose", "podman-compose.lti13-oss-platform-moodle.yaml");

function runCommand(command: string, args: string[], envOverrides?: NodeJS.ProcessEnv): number {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(envOverrides ?? {}),
    },
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
    adminEmail: process.env.LTI13_INTEROP_MOODLE_ADMIN_EMAIL?.trim() || "admin@example.local",
    adminPassword: process.env.LTI13_INTEROP_MOODLE_ADMIN_PASSWORD?.trim() || "admin-password",
    adminUsername: process.env.LTI13_INTEROP_MOODLE_ADMIN_USERNAME?.trim() || "admin",
    moodleBranch: process.env.LTI13_INTEROP_MOODLE_BRANCH?.trim() || "MOODLE_500_STABLE",
    composeFile: process.env.LTI13_INTEROP_MOODLE_COMPOSE_FILE?.trim() || defaultComposeFile,
    composeProjectName: process.env.LTI13_INTEROP_MOODLE_PROJECT_NAME?.trim() || "conform-ed-lti13-interop-moodle",
    keepStack: false,
    localPort: parsePort(process.env.LTI13_INTEROP_MOODLE_PORT?.trim() || "15600", "LTI13_INTEROP_MOODLE_PORT"),
    mode: "local",
    issuer: null,
    moodleBaseUrl: process.env.MOODLE_BASE_URL?.trim() || "",
    passthrough: [],
    readinessTimeoutMs: 300_000,
    siteFullName: process.env.LTI13_INTEROP_MOODLE_SITE_FULLNAME?.trim() || "Conform-Ed Moodle",
    siteShortName: process.env.LTI13_INTEROP_MOODLE_SITE_SHORTNAME?.trim() || "conform-ed-moodle",
    siteSummary: process.env.LTI13_INTEROP_MOODLE_SITE_SUMMARY?.trim() || "Conform-Ed LTI interoperability test Moodle",
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
      case "--moodle-branch":
        parsed.moodleBranch = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--admin-username":
        parsed.adminUsername = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--admin-password":
        parsed.adminPassword = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--admin-email":
        parsed.adminEmail = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--site-fullname":
        parsed.siteFullName = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--site-shortname":
        parsed.siteShortName = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--site-summary":
        parsed.siteSummary = readFlagValue(argv, index, arg);
        index += 1;
        break;
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
      case "--moodle-base-url":
        parsed.moodleBaseUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--platform-issuer":
        parsed.issuer = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--help":
        console.log(
          `Usage: bun run scripts/run-lti13-interop-oss-platform-moodle.ts [options] [-- <interop args>]\n\nOptions:\n  --mode <local|external>          Local compose mode (default) or external URLs\n  --moodle-base-url <url>          Moodle base URL (required in external mode; defaults to local fixture URL in local mode)\n  --platform-issuer <iss>          Optional issuer assertion (only applied when explicitly set)\n  --moodle-branch <name>           Moodle git branch for local checkout (default: MOODLE_500_STABLE)\n  --admin-username <value>         Moodle admin username (default: admin)\n  --admin-password <value>         Moodle admin password (default: admin-password)\n  --admin-email <value>            Moodle admin email\n  --site-fullname <value>          Moodle site full name\n  --site-shortname <value>         Moodle site short name\n  --site-summary <value>           Moodle site summary\n  --compose-file <path>            Compose file for local mode\n  --compose-project-name <name>    Compose project name for local mode\n  --local-port <port>              Local fixture port (default: 15600)\n  --readiness-timeout-ms <ms>      Readiness timeout for local fixture (default: 300000)\n  --keep-stack                     Keep local fixture stack running after the lane finishes\n  --help                           Show help\n\nAny additional args are passed through to scripts/run-lti13-interop-lane.ts.\n`,
        );
        process.exit(0);
      default:
        parsed.passthrough.push(arg);
        break;
    }
  }

  if (parsed.mode === "external" && !parsed.moodleBaseUrl) {
    throw new Error("Provide --moodle-base-url <url> or set MOODLE_BASE_URL when --mode external.");
  }

  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

function ensureMoodleCodeCheckout(wwwroot: string, branch: string): void {
  mkdirSync(resolve(wwwroot, ".."), { recursive: true });

  if (existsSync(resolve(wwwroot, "version.php"))) {
    return;
  }

  const status = runCommand("git", [
    "clone",
    "--depth",
    "1",
    "--branch",
    branch,
    "https://github.com/moodle/moodle.git",
    wwwroot,
  ]);

  if (status !== 0) {
    throw new Error(`Failed to clone Moodle branch ${branch}.`);
  }
}

function writeMoodleConfig(wwwroot: string, webPort: number): void {
  const configPath = resolve(wwwroot, "config.php");
  const config = `<?php
unset($CFG);
global $CFG;
$CFG = new stdClass();

$CFG->dbtype    = 'pgsql';
$CFG->dblibrary = 'native';
$CFG->dbhost    = 'db';
$CFG->dbname    = 'moodle';
$CFG->dbuser    = 'moodle';
$CFG->dbpass    = 'm@0dl3ing';
$CFG->prefix    = 'm_';
$CFG->dboptions = [];

$CFG->wwwroot   = 'http://127.0.0.1:${webPort}';
$CFG->dataroot  = '/var/www/moodledata';
$CFG->admin     = 'admin';
$CFG->directorypermissions = 0777;

require_once(__DIR__ . '/lib/setup.php');
`;

  writeFileSync(configPath, config, "utf8");
}

function initializeMoodleIfNeeded(args: ParsedArgs, composeEnv: NodeJS.ProcessEnv): void {
  const status = runCommand(
    "podman",
    [
      "compose",
      "-f",
      args.composeFile,
      "-p",
      args.composeProjectName,
      "exec",
      "-T",
      "webserver",
      "php",
      "admin/cli/install_database.php",
      "--agree-license",
      `--fullname=${args.siteFullName}`,
      `--shortname=${args.siteShortName}`,
      `--summary=${args.siteSummary}`,
      `--adminuser=${args.adminUsername}`,
      `--adminpass=${args.adminPassword}`,
      `--adminemail=${args.adminEmail}`,
    ],
    composeEnv,
  );

  if (status === 0) {
    return;
  }

  const upgradeStatus = runCommand(
    "podman",
    [
      "compose",
      "-f",
      args.composeFile,
      "-p",
      args.composeProjectName,
      "exec",
      "-T",
      "webserver",
      "php",
      "admin/cli/upgrade.php",
      "--non-interactive",
    ],
    composeEnv,
  );

  if (upgradeStatus !== 0) {
    throw new Error("Moodle initialization failed: install_database.php and upgrade.php both failed.");
  }
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

  throw new Error(`Timed out waiting for Moodle fixture readiness at ${url}.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const localBaseUrl = `http://127.0.0.1:${args.localPort}`;
  const baseUrl = trimTrailingSlash(args.moodleBaseUrl || localBaseUrl);
  const openIdConfigurationUrl = `${baseUrl}/mod/lti/openid-configuration.php`;
  const issuer = args.issuer?.trim() || null;
  const localWwwroot = resolve(repoRoot, "tmp", "agents", "lti13-moodle-wwwroot");
  const composeEnv: NodeJS.ProcessEnv = {
    MOODLE_DOCKER_WWWROOT: localWwwroot,
  };

  if (args.mode === "local") {
    ensureMoodleCodeCheckout(localWwwroot, args.moodleBranch);
    writeMoodleConfig(localWwwroot, args.localPort);

    const upStatus = runCommand(
      "podman",
      ["compose", "-f", args.composeFile, "-p", args.composeProjectName, "up", "-d"],
      composeEnv,
    );

    if (upStatus !== 0) {
      process.exitCode = upStatus;
      return;
    }

    try {
      await waitForReady(`${baseUrl}/`, args.readinessTimeoutMs);
      initializeMoodleIfNeeded(args, composeEnv);
      await waitForReady(`${baseUrl}/mod/lti/openid-configuration.php`, args.readinessTimeoutMs);
    } catch (error) {
      if (!args.keepStack) {
        runCommand(
          "podman",
          ["compose", "-f", args.composeFile, "-p", args.composeProjectName, "down", "-v"],
          composeEnv,
        );
      }
      throw error;
    }
  }

  let laneStatus = 0;
  try {
    const laneArgs = [
      "run",
      "scripts/run-lti13-interop-lane.ts",
      "--interop-profile",
      "oss-platform",
      "--role",
      "tool",
      "--platform-openid-configuration-url",
      openIdConfigurationUrl,
      ...args.passthrough,
    ];

    if (issuer) {
      laneArgs.push("--platform-issuer", issuer);
    }

    laneStatus = runCommand("bun", laneArgs);
  } finally {
    if (args.mode === "local" && !args.keepStack) {
      runCommand(
        "podman",
        ["compose", "-f", args.composeFile, "-p", args.composeProjectName, "down", "-v"],
        composeEnv,
      );
    }
  }

  if (laneStatus !== 0) {
    process.exitCode = laneStatus;
  }
}

await main();
