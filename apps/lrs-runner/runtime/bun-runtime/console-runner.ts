import { createRequire } from "node:module";
import { resolve } from "node:path";

import { parseConsoleRunnerArgv, type ConsoleRunnerOptions } from "./cli-args.ts";
import { definedProps } from "./defined-props.ts";
import { normalizeRunnerOptions, type NormalizedRunnerOptions } from "./options.ts";
import { createRunRecord, createOutputRunRecord, type RuntimeRunRecordFlags } from "./run-record.ts";
import { installRunnerEnvironment, registerSuiteFiles } from "./suite-loader.ts";
import { createDescribeRuntime, type RuntimeRunResult, type RuntimeRunSummary } from "./runtime.ts";

export type BunConsoleRunnerMode = "native";

export interface BunConsoleRunnerDependencies {
  cwd?: string;
  logger?: {
    error: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
  };
  now?: (() => number) | undefined;
  runnerMode?: BunConsoleRunnerMode;
  runNativeConsoleRunner?: (options: {
    parsedOptions: ConsoleRunnerOptions;
    runtimeRoot: string;
    normalizedOptions: NormalizedRunnerOptions;
    logger: {
      error: (...args: unknown[]) => void;
      log: (...args: unknown[]) => void;
    };
    now?: (() => number) | undefined;
  }) => Promise<number>;
}

export interface BunConsoleRunnerExecution {
  exitCode: number;
  forwardedArgv: string[];
  runnerMode: BunConsoleRunnerMode;
  normalizedOptions: NormalizedRunnerOptions;
  parsedOptions: ConsoleRunnerOptions;
}

export function startNativeSummaryHeartbeat(options: {
  getSummary: () => RuntimeRunSummary | undefined;
  emit?: (message: string) => void;
  intervalMs?: number;
  logger: {
    log: (...args: unknown[]) => void;
  };
}): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const currentSummary = options.getSummary();
    if (!currentSummary) {
      return;
    }

    const message = JSON.stringify({
      failed: currentSummary.failed,
      passed: currentSummary.passed,
      total: currentSummary.total,
      version: currentSummary.version,
    });

    if (options.emit) {
      options.emit(message);
      return;
    }

    options.logger.log(message);
  }, options.intervalMs ?? 2000);
}

function pushValueArg(argv: string[], flag: string, value: string | undefined): void {
  if (typeof value === "undefined") {
    return;
  }

  argv.push(flag, value);
}

function pushBooleanArg(argv: string[], flag: string, enabled: boolean | undefined): void {
  if (!enabled) {
    return;
  }

  argv.push(flag);
}

export function buildForwardedConsoleRunnerArgv(
  parsedOptions: ConsoleRunnerOptions,
  normalizedOptions: NormalizedRunnerOptions,
): string[] {
  const argv: string[] = [];

  if (parsedOptions.xapiVersion) {
    pushValueArg(argv, "--xapiVersion", normalizedOptions.xapiVersion);
  } else if (parsedOptions.directory) {
    pushValueArg(argv, "--directory", normalizedOptions.directory.join(","));
  }

  pushValueArg(argv, "--endpoint", normalizedOptions.endpoint);
  pushValueArg(argv, "--authUser", normalizedOptions.authUser);
  pushValueArg(argv, "--authPassword", normalizedOptions.authPass);
  pushBooleanArg(argv, "--basicAuth", normalizedOptions.basicAuth);
  pushBooleanArg(argv, "--oAuth1", normalizedOptions.oAuth1);
  pushValueArg(argv, "--consumer_key", normalizedOptions.consumer_key);
  pushValueArg(argv, "--consumer_secret", normalizedOptions.consumer_secret);
  pushValueArg(argv, "--request_token_path", normalizedOptions.request_token_path);
  pushValueArg(argv, "--auth_token_path", normalizedOptions.auth_token_path);
  pushValueArg(argv, "--authorization_path", normalizedOptions.authorization_path);
  pushValueArg(argv, "--grep", normalizedOptions.grep);
  pushBooleanArg(argv, "--bail", normalizedOptions.bail);
  pushBooleanArg(argv, "--errors", normalizedOptions.errors);
  pushValueArg(argv, "--optional", normalizedOptions.optional?.join(","));
  pushValueArg(argv, "--file", normalizedOptions.file?.join(","));

  return argv;
}

function resolveRuntimeRoot(cwd: string | undefined): string {
  return cwd ?? resolve(import.meta.dir, "..");
}

function readLegacyVersionNumber(runtimeRoot: string): string {
  const requireFromRuntimeRoot = createRequire(resolve(runtimeRoot, "package.json"));
  const versionModule = requireFromRuntimeRoot(resolve(runtimeRoot, "version.ts")) as {
    versionNumber?: unknown;
  };

  return typeof versionModule.versionNumber === "string" ? versionModule.versionNumber : "";
}

function buildRuntimeRecordFlags(normalizedOptions: NormalizedRunnerOptions): RuntimeRunRecordFlags {
  return {
    endpoint: normalizedOptions.endpoint,
    basicAuth: normalizedOptions.basicAuth,
    oAuth1: normalizedOptions.oAuth1,
    ...definedProps({
      authUser: normalizedOptions.authUser,
      consumer_key: normalizedOptions.consumer_key,
      grep: normalizedOptions.grep,
      optional: normalizedOptions.optional,
      file: normalizedOptions.file,
    }),
  };
}

function createRuntimeOptions(normalizedOptions: NormalizedRunnerOptions): Record<string, unknown> {
  return {
    bail: normalizedOptions.bail,
    directory: normalizedOptions.directory,
    errors: normalizedOptions.errors,
    file: normalizedOptions.file,
    optional: normalizedOptions.optional,
  };
}

function getDefaultLogDirectory(runtimeRoot: string): string {
  return resolve(runtimeRoot, "logs");
}

async function writeRunRecord(logPath: string, outputRecord: ReturnType<typeof createOutputRunRecord>): Promise<void> {
  await Bun.write(logPath, `${JSON.stringify(outputRecord, null, 4)}\n`);
}

async function defaultRunNativeConsoleRunner(options: {
  parsedOptions: ConsoleRunnerOptions;
  runtimeRoot: string;
  normalizedOptions: NormalizedRunnerOptions;
  logger: {
    error: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
  };
  now?: (() => number) | undefined;
}): Promise<number> {
  const restoreRunnerEnvironment = installRunnerEnvironment(options.normalizedOptions);
  const writeRawStdout = process.stdout.write.bind(process.stdout);
  const runtime = createDescribeRuntime({
    rootTitle: "",
    version: options.normalizedOptions.xapiVersion,
    bail: options.normalizedOptions.bail,
    grep: options.normalizedOptions.grep ? new RegExp(options.normalizedOptions.grep) : undefined,
    now: options.now,
  });
  let summaryInterval: ReturnType<typeof setInterval> | undefined;

  try {
    await registerSuiteFiles({
      normalizedOptions: options.normalizedOptions,
      runtime,
      runtimeRoot: options.runtimeRoot,
    });

    summaryInterval = startNativeSummaryHeartbeat({
      emit: (message) => {
        writeRawStdout(`${message}\n`);
      },
      getSummary: () => runtime.getSummary(),
      logger: options.logger,
    });

    const runResult: RuntimeRunResult = await runtime.run();
    const summaryVersion = options.parsedOptions.xapiVersion ?? readLegacyVersionNumber(options.runtimeRoot);
    const runRecord = createRunRecord(runResult, {
      flags: buildRuntimeRecordFlags(options.normalizedOptions),
      name: "console",
      options: createRuntimeOptions(options.normalizedOptions),
      rollupRule: "mustPassAll",
      summaryVersion,
    });
    const outputRecord = createOutputRunRecord(runRecord, options.normalizedOptions.errors);
    const logPath = resolve(getDefaultLogDirectory(options.runtimeRoot), `${runRecord.uuid}.log`);

    await writeRunRecord(logPath, outputRecord);

    options.logger.log(JSON.stringify(runRecord.summary));
    options.logger.log(`Tests completed in ${runRecord.duration / 1000} seconds`);
    options.logger.log("Test Suite Complete");
    options.logger.log(`Full run log written to ${logPath}`);

    return typeof runRecord.summary.failed === "number" ? runRecord.summary.failed : 1;
  } finally {
    if (summaryInterval) {
      clearInterval(summaryInterval);
    }
    restoreRunnerEnvironment();
  }
}

export async function runConsoleRunnerArgv(
  argv: string[],
  dependencies: BunConsoleRunnerDependencies = {},
): Promise<BunConsoleRunnerExecution> {
  const parsedOptions = parseConsoleRunnerArgv(argv);
  const normalizedOptions = normalizeRunnerOptions(parsedOptions);
  const forwardedArgv = buildForwardedConsoleRunnerArgv(parsedOptions, normalizedOptions);
  const runtimeRoot = resolveRuntimeRoot(dependencies.cwd);
  const runnerMode: BunConsoleRunnerMode = dependencies.runnerMode ?? "native";
  const logger = dependencies.logger ?? console;
  const exitCode = await (dependencies.runNativeConsoleRunner ?? defaultRunNativeConsoleRunner)({
    parsedOptions,
    runtimeRoot,
    normalizedOptions,
    logger,
    now: dependencies.now,
  });

  return {
    exitCode,
    forwardedArgv,
    runnerMode,
    normalizedOptions,
    parsedOptions,
  };
}

export async function main(argv: string[], dependencies: BunConsoleRunnerDependencies = {}): Promise<number> {
  const logger = dependencies.logger ?? console;

  try {
    const execution = await runConsoleRunnerArgv(argv, dependencies);
    return execution.exitCode;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}
