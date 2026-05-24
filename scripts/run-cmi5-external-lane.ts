import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

type ParsedArgs = {
  adapterBaseUrl: string | null;
  adapterPort: number;
  adapterToken: string;
  expectedAdapterName: string | null;
  keepAdapter: boolean;
  outputDir: string;
  readinessTimeoutMs: number;
  reportFile: string;
};

type LaneReport = {
  adapterBaseUrl: string;
  adapterReady: boolean;
  adapterStart: {
    pid: number | null;
  };
  endedAt: string;
  outputDir: string;
  reportFile: string;
  runner: {
    exitCode: number | null;
    parsedResult: unknown;
    stderr: string;
    stdout: string;
  };
  startedAt: string;
  status: "passed" | "failed";
};

type RunnerParsedStatus = {
  adapter?: {
    adapterName?: unknown;
  };
  result?: {
    status?: unknown;
  };
  status?: unknown;
};

const repoRoot = resolve(import.meta.dir, "..");
const defaultOutputDir = resolve(repoRoot, "tmp", "agents", `cmi5-external-${Date.now()}`);

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

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    adapterBaseUrl: null,
    adapterPort: 4500,
    adapterToken: "conform-ed-cmi5-external-token",
    expectedAdapterName: null,
    keepAdapter: false,
    outputDir: defaultOutputDir,
    readinessTimeoutMs: 20_000,
    reportFile: resolve(defaultOutputDir, "lane-report.json"),
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
      case "--output-dir": {
        parsed.outputDir = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      }
      case "--report-file": {
        parsed.reportFile = resolve(repoRoot, readFlagValue(argv, index, arg));
        index += 1;
        break;
      }
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
          `Usage: bun run scripts/run-cmi5-external-lane.ts [options]\n\nOptions:\n  --adapter-port <port>           Adapter port when launching the reference adapter (default: 4500)\n  --adapter-base-url <url>        Use an already running external adapter URL\n  --adapter-token <token>         Adapter bearer token\n  --expected-adapter-name <name>  Require runner output adapter.adapterName to match\n  --output-dir <path>             Artifact directory under repo (default: tmp/agents/...)\n  --report-file <path>            Report file path under repo\n  --readiness-timeout-ms <ms>     Adapter readiness timeout\n  --keep-adapter                  Keep spawned reference adapter process running after lane\n  --help                          Show help\n`,
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

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  mkdirSync(args.outputDir, { recursive: true });

  const configPath = resolve(args.outputDir, "cmi5.external.config.json");
  const runnerArtifactsDir = resolve(args.outputDir, "runner-artifacts");
  const adapterBaseUrl = args.adapterBaseUrl ?? `http://127.0.0.1:${args.adapterPort}`;

  const configPayload = {
    contractVersion: "1.0.0",
    suite: { name: "cmi5", target: "all" },
    sut: {
      publicUrls: {
        api: "http://127.0.0.1:4301",
        runtime: "http://127.0.0.1:4312",
        lrs: "http://127.0.0.1:4311/xapi",
      },
    },
    adapter: {
      kind: "http",
      baseUrl: adapterBaseUrl,
      auth: {
        mode: "bearer",
        tokenFromEnv: "CONFORM_ED_ADAPTER_TOKEN",
      },
    },
    artifacts: {
      outputDir: runnerArtifactsDir,
    },
  };
  writeJson(configPath, configPayload);

  const adapterProcess =
    args.adapterBaseUrl === null
      ? spawn("bun", ["--cwd", "apps/cmi5-adapter-reference", "src/index.ts"], {
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
      ["--cwd", "apps/cmi5-runner", "src/index.ts", "run", "--config", configPath],
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
  const parsedAdapterName =
    parsedResult && typeof parsedResult === "object"
      ? ((parsedResult as RunnerParsedStatus).adapter?.adapterName ?? null)
      : null;
  const parsedResultStatus =
    parsedResult && typeof parsedResult === "object"
      ? ((parsedResult as RunnerParsedStatus).result?.status ?? null)
      : null;
  const adapterNameMatched =
    args.expectedAdapterName === null ||
    (typeof parsedAdapterName === "string" && parsedAdapterName === args.expectedAdapterName);

  const status: "passed" | "failed" =
    adapterReady &&
    runnerExitCode === 0 &&
    parsedStatus === "completed" &&
    parsedResultStatus === "passed" &&
    adapterNameMatched
      ? "passed"
      : "failed";

  const report: LaneReport = {
    adapterBaseUrl,
    adapterReady,
    adapterStart: {
      pid: adapterProcess?.pid ?? null,
    },
    endedAt: new Date().toISOString(),
    outputDir: args.outputDir,
    reportFile: args.reportFile,
    runner: {
      exitCode: runnerExitCode,
      parsedResult,
      stderr: runnerStderr,
      stdout: runnerStdout,
    },
    startedAt,
    status,
  };

  writeJson(args.reportFile, report);
  console.log(JSON.stringify(report, null, 2));

  if (status !== "passed") {
    process.exitCode = 1;
  }
}

await run();
