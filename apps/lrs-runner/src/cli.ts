import { runLrs } from "./run.ts";
import { lrsTargets } from "./targets";
import { lrsRunnerVersion } from "./version";

type SupportedSpecVersion = "2.0.0" | "1.0.3";

interface ExportRunConfig {
  baseUrl: string;
  directory?: string[];
  file?: string[];
  grep?: string;
  version: SupportedSpecVersion;
  username?: string;
  password?: string;
}

function parseCsvFlag(args: string[], flag: string): string[] | undefined {
  const value = getFlagValue(args, flag);
  if (!value) {
    return undefined;
  }

  const parsed = value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return parsed.length > 0 ? parsed : undefined;
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function usage(): string {
  return [
    "Usage:",
    "  bun run apps/lrs-runner/src/cli.ts run --base-url <url> [--version 2.0.0|1.0.3] [--username <user> --password <pass>]",
    "  Environment: LRS_BASE_URL, LRS_VERSION, LRS_USERNAME, LRS_PASSWORD",
    "  Optional selection: --directory <csv> --file <csv> --grep <pattern>",
    "",
    "Examples:",
    "  bun run apps/lrs-runner/src/cli.ts run --base-url http://localhost:8080/xapi --username janedoe --password supersecret",
    "  bun run apps/lrs-runner/src/cli.ts run --base-url http://localhost:8080/xapi --version 1.0.3",
  ].join("\n");
}

function parseConfig(args: string[]): ExportRunConfig | undefined {
  const baseUrl = getFlagValue(args, "--base-url") ?? process.env["LRS_BASE_URL"]?.trim();
  const versionFlag = getFlagValue(args, "--version") ?? process.env["LRS_VERSION"]?.trim() ?? "2.0.0";
  const directory = parseCsvFlag(args, "--directory");
  const file = parseCsvFlag(args, "--file");
  const grep = getFlagValue(args, "--grep");
  const username = getFlagValue(args, "--username") ?? process.env["LRS_USERNAME"]?.trim();
  const password = getFlagValue(args, "--password") ?? process.env["LRS_PASSWORD"]?.trim();

  if (!baseUrl) {
    return undefined;
  }

  if (versionFlag !== "2.0.0" && versionFlag !== "1.0.3") {
    throw new Error(`Unsupported --version value: ${versionFlag}`);
  }

  if ((username && !password) || (!username && password)) {
    throw new Error("Provide both --username and --password together.");
  }

  return {
    baseUrl,
    directory,
    file,
    grep,
    version: versionFlag,
    username,
    password,
  };
}

async function main(): Promise<number> {
  const [command = "help", ...args] = process.argv.slice(2);

  switch (command) {
    case "run": {
      const config = parseConfig(args);

      if (!config) {
        console.error(usage());
        return 1;
      }

      const execution = await runLrs({
        baseUrl: config.baseUrl,
        directory: config.directory,
        file: config.file,
        grep: config.grep,
        version: config.version,
        username: config.username,
        password: config.password,
      });

      if (execution.stdout.length > 0) {
        process.stdout.write(execution.stdout);
      }

      if (execution.stderr.length > 0) {
        process.stderr.write(execution.stderr);
      }

      return execution.exitCode;
    }
    case "validate-config": {
      parseConfig(args);
      console.log(JSON.stringify({ valid: true }, null, 2));
      return 0;
    }
    case "print-schema":
      console.log(JSON.stringify({ schema: "schemas/v1/config.schema.json" }, null, 2));
      return 0;
    case "list-targets":
      console.log(JSON.stringify({ targets: lrsTargets }, null, 2));
      return 0;
    case "version":
      console.log(JSON.stringify({ version: lrsRunnerVersion }, null, 2));
      return 0;
    case "help":
    default:
      console.log(usage());
      return 0;
  }
}

process.exitCode = await main();
