import { runLrs } from "../apps/lrs-runner/src/run.ts";

declare const process: {
  argv: string[];
  exitCode?: number;
  stdout: {
    write(text: string): void;
  };
};

type SupportedSpecVersion = "2.0.0" | "1.0.3";

interface ExportRunConfig {
  baseUrl: string;
  version: SupportedSpecVersion;
  username?: string;
  password?: string;
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
    "  bun run test:lrs:run -- --base-url <url> [--version 2.0.0|1.0.3] [--username <user> --password <pass>]",
    "",
    "Examples:",
    "  bun run test:lrs:run -- --base-url http://localhost:8080/xapi --username janedoe --password supersecret",
    "  bun run test:lrs:run -- --base-url http://localhost:8080/xapi --version 1.0.3",
  ].join("\n");
}

function parseConfig(args: string[]): ExportRunConfig | undefined {
  const baseUrl = getFlagValue(args, "--base-url");
  const versionFlag = getFlagValue(args, "--version") ?? "2.0.0";
  const username = getFlagValue(args, "--username");
  const password = getFlagValue(args, "--password");

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
    version: versionFlag,
    username,
    password,
  };
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const config = parseConfig(args);

  if (!config) {
    console.error(usage());
    return 1;
  }

  const scaffoldResult = await runLrs({
    baseUrl: config.baseUrl,
    version: config.version,
    username: config.username,
    password: config.password,
  });

  process.stdout.write(scaffoldResult.stdout);

  return scaffoldResult.exitCode;
}

try {
  process.exitCode = await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
