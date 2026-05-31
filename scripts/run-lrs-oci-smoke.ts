import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { imageRef } from "./image-catalog";

type ParsedArgs = {
  baseUrl: string;
  imageRef: string;
  outputDir: string;
  password: string | null;
  version: "1.0.3" | "2.0.0";
  username: string | null;
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultOutputDir = resolve(repoRoot, "tmp", "agents", `lrs-oci-smoke-${Date.now()}`);

function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]?.trim();
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function parseVersion(value: string | undefined): "1.0.3" | "2.0.0" {
  if (value === "1.0.3" || value === "2.0.0") {
    return value;
  }

  return "2.0.0";
}

function toContainerBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1") {
    url.hostname = "host.containers.internal";
  }

  return url.toString().replace(/\/$/, "");
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    baseUrl: process.env.LRS_BASE_URL?.trim() || "",
    imageRef:
      process.env.LRS_RUNNER_IMAGE_REF?.trim() ||
      imageRef(
        "lrs-runner",
        process.env.VERSION_TAG ?? "local",
        process.env.IMAGE_REGISTRY ?? "ghcr.io",
        process.env.IMAGE_NAMESPACE ?? "conform-ed",
      ),
    outputDir: defaultOutputDir,
    password: process.env.LRS_PASSWORD?.trim() || null,
    version: parseVersion(process.env.LRS_VERSION?.trim()),
    username: process.env.LRS_USERNAME?.trim() || null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--base-url":
        parsed.baseUrl = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--image-ref":
        parsed.imageRef = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--output-dir":
        parsed.outputDir = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      case "--version":
        parsed.version = parseVersion(readFlagValue(argv, index, arg));
        index += 1;
        break;
      case "--username":
        parsed.username = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--password":
        parsed.password = readFlagValue(argv, index, arg);
        index += 1;
        break;
      case "--help":
        console.log(
          `Usage: bun run scripts/run-lrs-oci-smoke.ts [options]\n\nOptions:\n  --base-url <url>        Target LRS base URL (required)\n  --image-ref <ref>       OCI image ref for lrs-runner (default: computed from IMAGE_* env)\n  --output-dir <path>     Artifact directory under tmp/ (default: tmp/agents/...)\n  --version <1.0.3|2.0.0> xAPI version (default: 2.0.0)\n  --username <value>      Basic auth username\n  --password <value>      Basic auth password\n  --help                  Show help\n`,
        );
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!parsed.baseUrl) {
    throw new Error("--base-url is required.");
  }

  if ((parsed.username && !parsed.password) || (!parsed.username && parsed.password)) {
    throw new Error("Provide both --username and --password together.");
  }

  if (!parsed.outputDir.startsWith(resolve(repoRoot, "tmp") + "/")) {
    throw new Error("--output-dir must be under tmp/");
  }

  return parsed;
}

function runCommand(command: string[], envOverrides?: NodeJS.ProcessEnv): { exitCode: number; stdout: string } {
  const result = Bun.spawnSync(command, {
    cwd: repoRoot,
    env: {
      ...process.env,
      ...(envOverrides ?? {}),
    },
    stdout: "pipe",
    stderr: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  const stdout =
    typeof result.stdout === "string" ? result.stdout : result.stdout ? new TextDecoder().decode(result.stdout) : "";
  if (typeof result.stdout === "string") {
    process.stdout.write(result.stdout);
  } else if (result.stdout) {
    process.stdout.write(new TextDecoder().decode(result.stdout));
  }

  return {
    exitCode: result.exitCode ?? 1,
    stdout,
  };
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(args.outputDir, { recursive: true });
  const containerBaseUrl = toContainerBaseUrl(args.baseUrl);

  const artifactPath = resolve(args.outputDir, "lrs-oci-smoke-report.json");
  const command = [
    "podman",
    "run",
    "--rm",
    "--add-host",
    "host.containers.internal:host-gateway",
    "-e",
    `LRS_BASE_URL=${containerBaseUrl}`,
    "-e",
    `LRS_VERSION=${args.version}`,
    args.imageRef,
  ];

  if (args.username) {
    command.push("-e", `LRS_USERNAME=${args.username}`, "-e", `LRS_PASSWORD=${args.password ?? ""}`);
  }

  const execution = runCommand(command);
  if (execution.exitCode !== 0) {
    return execution.exitCode;
  }

  writeFileSync(artifactPath, execution.stdout, "utf8");

  console.log(
    JSON.stringify(
      {
        imageRef: args.imageRef,
        baseUrl: args.baseUrl,
        artifactPath,
        version: args.version,
      },
      null,
      2,
    ),
  );

  return 0;
}

process.exitCode = await main();
