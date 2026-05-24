import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { runLrs } from "./run";
import { lrsTargets } from "./targets";
import { lrsRunnerVersion } from "./version";
const repoRoot = resolve(import.meta.dir, "..", "..", "..");

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
    "  bun run apps/lrs-runner/src/cli.ts run --base-url <url> [--version 2.0.0|1.0.3] [--out <path>] [--username <user> --password <pass>]",
    "",
    "Examples:",
    "  bun run apps/lrs-runner/src/cli.ts run --base-url http://localhost:8080/xapi --username janedoe --password supersecret --out tmp/agents/lrsql-run.json",
    "  bun run apps/lrs-runner/src/cli.ts run --base-url http://localhost:8080/xapi --version 1.0.3 --out tmp/agents/lrsql-v103-run.json",
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
  const [command = "help", ...args] = process.argv.slice(2);

  switch (command) {
    case "run": {
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

      const absoluteOutputPath = resolve(repoRoot, config.outputPath);
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
