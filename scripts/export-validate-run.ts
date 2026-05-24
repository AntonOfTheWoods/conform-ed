import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runLrs } from "../apps/lrs-runner/src/run";

type SupportedSpecVersion = "2.0.0" | "1.0.3";

interface ExportRunConfig {
  baseUrl: string;
  version: SupportedSpecVersion;
  outputPath: string;
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
    "  bun run test:lrs:run -- --base-url <url> [--version 2.0.0|1.0.3] [--out <path>] [--username <user> --password <pass>]",
    "",
    "Examples:",
    "  bun run test:lrs:run -- --base-url http://localhost:8080/xapi --username janedoe --password supersecret --out tmp/agents/lrsql-run.json",
    "  bun run test:lrs:run -- --base-url http://localhost:8080/xapi --version 1.0.3 --out tmp/agents/lrsql-v103-run.json",
  ].join("\n");
}

function parseConfig(args: string[]): ExportRunConfig | undefined {
  const baseUrl = getFlagValue(args, "--base-url");
  const versionFlag = getFlagValue(args, "--version") ?? "2.0.0";
  const outputPath = getFlagValue(args, "--out") ?? "tmp/agents/validate-run.json";
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
    outputPath,
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

  const absoluteOutputPath = resolve(config.outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });

  const payload = {
    generatedAt: scaffoldResult.generatedAt,
    target: scaffoldResult.target,
    run: {
      ...scaffoldResult.run,
      root: scaffoldResult.root,
    },
  };

  await writeFile(absoluteOutputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        outputPath: absoluteOutputPath,
        version: scaffoldResult.run.version,
        status: scaffoldResult.run.status,
        events: scaffoldResult.run.events.length,
      },
      null,
      2,
    ),
  );

  return scaffoldResult.run.status === "failed" ? 1 : 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
