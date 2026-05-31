import { format } from "node:util";

export type RuntimeStatus = "passed" | "failed" | "skipped" | "cancelled";

export interface RuntimeNodeBase {
  title: string;
  name: string;
  requirement: string;
  status: RuntimeStatus;
  error?: string;
  log: string[];
}

export interface RuntimeSuiteResult extends RuntimeNodeBase {
  kind: "suite";
  children: RuntimeNodeResult[];
}

export interface RuntimeCaseResult extends RuntimeNodeBase {
  kind: "case";
  children: [];
}

export type RuntimeNodeResult = RuntimeSuiteResult | RuntimeCaseResult;

export interface RuntimeRunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cancelled: number;
  version?: string;
}

export interface RuntimeRunResult {
  root: RuntimeSuiteResult;
  summary: RuntimeRunSummary;
  state: "finished" | "cancelled";
  startTime: number;
  endTime: number;
  duration: number;
}

export interface DescribeRuntimeOptions {
  rootTitle: string;
  version?: string;
  bail?: boolean;
  grep?: RegExp;
  now?: () => number;
}

export type DoneCallback = (error?: unknown, ...ignored: unknown[]) => void;

type Runnable = ((done: DoneCallback) => unknown) | (() => unknown);
type SuiteBuilder = ((done?: DoneCallback) => void) | (() => void);

interface HookDefinition {
  title: string;
  fn: Runnable;
}

interface SuiteDefinition {
  kind: "suite";
  title: string;
  synthetic: boolean;
  beforeHooks: HookDefinition[];
  children: DefinitionNode[];
}

interface CaseDefinition {
  kind: "case";
  title: string;
  fn?: Runnable;
}

type DefinitionNode = SuiteDefinition | CaseDefinition;

interface TitleMetadata {
  name: string;
  requirement: string;
}

interface ExecutionState {
  summary: RuntimeRunSummary;
  cancelRemaining: boolean;
  bail: boolean;
  grep?: RegExp;
}

export interface DescribeRuntime {
  before(title: string, fn: Runnable): void;
  before(fn: Runnable): void;
  describe(title: string, build: SuiteBuilder): void;
  getSummary(): RuntimeRunSummary | undefined;
  it(title: string, fn?: Runnable): void;
  run(): Promise<RuntimeRunResult>;
}

type StreamWrite = typeof process.stdout.write;

type CaptureExecutionState = {
  suitePath: string[];
  testTitle: string | null;
};

type RuntimeGlobalState = ExecutionSuiteGlobals & {
  __lrsConformanceCaptureExecutionState?: CaptureExecutionState;
};

type ExecutionSuiteGlobals = typeof globalThis & {
  before?: {
    (title: string, fn: Runnable): void;
    (fn: Runnable): void;
  };
  context?: ((title: string, build: SuiteBuilder) => void) & { skip?: (title: string, build: SuiteBuilder) => void };
  describe?: ((title: string, build: SuiteBuilder) => void) & { skip?: (title: string, build: SuiteBuilder) => void };
  it?: ((title: string, fn?: Runnable) => void) & { skip?: (title: string, fn?: Runnable) => void };
  specify?: ((title: string, fn?: Runnable) => void) & { skip?: (title: string, fn?: Runnable) => void };
};

function parseTitleMetadata(title: string): TitleMetadata {
  const match = /\(([^)]*\d[^)]*)\)/.exec(title);
  if (!match) {
    return {
      name: title,
      requirement: "",
    };
  }

  return {
    name: title.slice(0, match.index).trim(),
    requirement: match[1] ?? "",
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error instanceof RangeError && error.message === "Invalid Date") {
      return "RangeError: Invalid time value";
    }

    return error.toString();
  }

  return String(error);
}

function matchesPattern(pattern: RegExp | undefined, value: string): boolean {
  if (!pattern) {
    return true;
  }

  pattern.lastIndex = 0;
  return pattern.test(value);
}

function buildFullTitle(path: string[], title: string): string {
  return [...path, title].join(" ");
}

function countMatchingCases(definition: SuiteDefinition, path: string[], pattern: RegExp | undefined): number {
  const suitePath = definition.synthetic ? path : [...path, definition.title];

  return definition.children.reduce((count, child) => {
    if (child.kind === "suite") {
      return count + countMatchingCases(child, suitePath, pattern);
    }

    return count + (matchesPattern(pattern, buildFullTitle(suitePath, child.title)) ? 1 : 0);
  }, 0);
}

function hasMatchingDescendant(definition: SuiteDefinition, path: string[], pattern: RegExp | undefined): boolean {
  return countMatchingCases(definition, path, pattern) > 0;
}

function getExecutionChildren(children: DefinitionNode[]): DefinitionNode[] {
  const cases: DefinitionNode[] = [];
  const suites: DefinitionNode[] = [];

  for (const child of children) {
    if (child.kind === "case") {
      cases.push(child);
      continue;
    }

    suites.push(child);
  }

  return [...cases, ...suites];
}

function rollupSuiteStatus(children: RuntimeNodeResult[]): RuntimeStatus {
  let sawCancelled = false;

  for (const child of children) {
    if (child.status === "failed") {
      return "failed";
    }

    if (child.status === "cancelled") {
      sawCancelled = true;
    }
  }

  return sawCancelled ? "cancelled" : "passed";
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (typeof value === "object" || typeof value === "function") && value !== null && "then" in value;
}

function createMochaContext(): {
  retries: (_count: number) => void;
  slow: (_ms: number) => void;
  timeout: (_ms: number) => void;
} {
  return {
    retries: () => {},
    slow: () => {},
    timeout: () => {},
  };
}

function cloneExecutionState(): { suitePath: string[]; testTitle: string | null } | undefined {
  const globalState = globalThis as RuntimeGlobalState;
  const executionState = globalState.__lrsConformanceCaptureExecutionState;
  if (!executionState || !Array.isArray(executionState.suitePath)) {
    return undefined;
  }

  return {
    suitePath: [...executionState.suitePath],
    testTitle: typeof executionState.testTitle === "string" ? executionState.testTitle : null,
  };
}

function captureChunk(outputLog: string[], chunk: string | Uint8Array, encoding?: BufferEncoding): void {
  outputLog.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString(encoding));
}

function withExecutionGlobals<T>(fn: () => Promise<T> | T): Promise<T> {
  const globalState = globalThis as ExecutionSuiteGlobals;
  const previousDescribe = globalState.describe;
  const previousContext = globalState.context;
  const previousIt = globalState.it;
  const previousSpecify = globalState.specify;
  const previousBefore = globalState.before;

  const noopDescribe = Object.assign((_title: string, _build: SuiteBuilder) => {}, {
    skip: (_title: string, _build: SuiteBuilder) => {},
  });
  const noopIt = Object.assign((_title: string, _fn?: Runnable) => {}, {
    skip: (_title: string, _fn?: Runnable) => {},
  });
  const noopBefore = ((_titleOrFn: string | Runnable, _maybeFn?: Runnable) => {}) as ExecutionSuiteGlobals["before"];

  globalState.describe = noopDescribe as ExecutionSuiteGlobals["describe"];
  globalState.context = noopDescribe as ExecutionSuiteGlobals["context"];
  globalState.it = noopIt as ExecutionSuiteGlobals["it"];
  globalState.specify = noopIt as ExecutionSuiteGlobals["specify"];
  globalState.before = noopBefore as ExecutionSuiteGlobals["before"];

  return Promise.resolve(fn()).finally(() => {
    globalState.describe = previousDescribe;
    globalState.context = previousContext;
    globalState.it = previousIt;
    globalState.specify = previousSpecify;
    globalState.before = previousBefore;
  });
}

function withCapturedOutput<T>(outputLog: string[], fn: () => Promise<T> | T): Promise<T> {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  const originalConsoleLog = console.log.bind(console);
  const originalConsoleInfo = console.info.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleError = console.error.bind(console);
  const originalConsoleDebug = console.debug.bind(console);
  let suppressStreamCapture = false;

  const captureWrite = (originalWrite: StreamWrite): StreamWrite => {
    return ((
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void),
      maybeCallback?: (error?: Error | null) => void,
    ) => {
      const encoding = typeof encodingOrCallback === "string" ? encodingOrCallback : undefined;
      if (!suppressStreamCapture) {
        captureChunk(outputLog, chunk, encoding);
      }
      return originalWrite(chunk, encodingOrCallback as never, maybeCallback as never);
    }) as StreamWrite;
  };

  const captureConsoleMethod = <TArgs extends unknown[]>(originalMethod: (...args: TArgs) => void) => {
    return (...args: TArgs): void => {
      outputLog.push(`${format(...args)}\n`);
      suppressStreamCapture = true;

      try {
        originalMethod(...args);
      } finally {
        suppressStreamCapture = false;
      }
    };
  };

  process.stdout.write = captureWrite(originalStdoutWrite);
  process.stderr.write = captureWrite(originalStderrWrite);
  console.log = captureConsoleMethod(originalConsoleLog);
  console.info = captureConsoleMethod(originalConsoleInfo);
  console.warn = captureConsoleMethod(originalConsoleWarn);
  console.error = captureConsoleMethod(originalConsoleError);
  console.debug = captureConsoleMethod(originalConsoleDebug);

  return Promise.resolve(fn()).finally(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
  });
}

function withGlobalExecutionState<T>(
  suitePath: string[],
  testTitle: string | null,
  fn: () => Promise<T> | T,
): Promise<T> {
  const previousState = cloneExecutionState();
  const globalState = globalThis as RuntimeGlobalState;
  globalState.__lrsConformanceCaptureExecutionState = {
    suitePath: [...suitePath],
    testTitle,
  };

  return Promise.resolve(fn()).finally(() => {
    if (!previousState) {
      delete globalState.__lrsConformanceCaptureExecutionState;
      return;
    }

    globalState.__lrsConformanceCaptureExecutionState = previousState;
  });
}

async function runRunnable(
  fn: Runnable,
  suitePath: string[],
  testTitle: string | null,
  outputLog: string[],
): Promise<void> {
  const mochaContext = createMochaContext();

  await withCapturedOutput(outputLog, () =>
    withGlobalExecutionState(suitePath, testTitle, async () => {
      await withExecutionGlobals(async () => {
        await new Promise<void>((resolve, reject) => {
          let settled = false;

          const cleanup = (): void => {
            process.removeListener("uncaughtException", handleUncaughtException);
            process.removeListener("unhandledRejection", handleUnhandledRejection);
          };

          const resolveOnce = (): void => {
            if (settled) {
              return;
            }

            settled = true;
            cleanup();
            resolve();
          };

          const rejectOnce = (error: unknown): void => {
            if (settled) {
              return;
            }

            settled = true;
            cleanup();
            reject(error);
          };

          const handleUncaughtException = (error: Error): void => {
            rejectOnce(error);
          };

          const handleUnhandledRejection = (reason: unknown): void => {
            rejectOnce(reason);
          };

          process.once("uncaughtException", handleUncaughtException);
          process.once("unhandledRejection", handleUnhandledRejection);

          try {
            if (fn.length > 0) {
              const maybeResult = (fn as (this: typeof mochaContext, done: DoneCallback) => unknown).call(
                mochaContext,
                (error?: unknown) => {
                  if (error !== null && typeof error !== "undefined") {
                    rejectOnce(error);
                    return;
                  }

                  resolveOnce();
                },
              );

              if (isPromiseLike(maybeResult)) {
                Promise.resolve(maybeResult).then(resolveOnce, rejectOnce);
              }

              return;
            }

            const maybeResult = (fn as (this: typeof mochaContext) => unknown).call(mochaContext);
            if (isPromiseLike(maybeResult)) {
              Promise.resolve(maybeResult).then(resolveOnce, rejectOnce);
              return;
            }

            resolveOnce();
          } catch (error) {
            rejectOnce(error);
          }
        });
      });
    }),
  );
}

function createSuiteResult(title: string): RuntimeSuiteResult {
  const metadata = parseTitleMetadata(title);

  return {
    kind: "suite",
    title,
    name: metadata.name,
    requirement: metadata.requirement,
    status: "passed",
    log: [],
    children: [],
  };
}

function createCaseResult(title: string, status: RuntimeStatus, error?: string): RuntimeCaseResult {
  const metadata = parseTitleMetadata(title);

  return {
    kind: "case",
    title,
    name: metadata.name,
    requirement: metadata.requirement,
    status,
    error,
    log: [],
    children: [],
  };
}

function buildCancelledSuite(
  definition: SuiteDefinition,
  path: string[],
  state: ExecutionState,
): RuntimeSuiteResult | undefined {
  if (!hasMatchingDescendant(definition, path, state.grep)) {
    return undefined;
  }

  const suitePath = definition.synthetic ? path : [...path, definition.title];
  const result = createSuiteResult(definition.title);
  result.status = "cancelled";

  for (const child of getExecutionChildren(definition.children)) {
    if (child.kind === "suite") {
      const childResult = buildCancelledSuite(child, suitePath, state);
      if (childResult) {
        result.children.push(childResult);
      }
      continue;
    }

    if (!matchesPattern(state.grep, buildFullTitle(suitePath, child.title))) {
      continue;
    }

    state.summary.cancelled += 1;
    result.children.push(createCaseResult(child.title, "cancelled"));
  }

  result.status = rollupSuiteStatus(result.children);
  return result;
}

async function executeCase(
  definition: CaseDefinition,
  path: string[],
  state: ExecutionState,
): Promise<RuntimeCaseResult> {
  const runnable = definition.fn;
  if (!runnable) {
    state.summary.skipped += 1;
    return createCaseResult(definition.title, "skipped");
  }

  const result = createCaseResult(definition.title, "passed");

  try {
    await runRunnable(runnable, [...path], definition.title, result.log);
    state.summary.passed += 1;
    return result;
  } catch (error) {
    state.summary.failed += 1;
    if (state.bail) {
      state.cancelRemaining = true;
    }

    result.status = "failed";
    result.error = toErrorMessage(error);
    return result;
  }
}

async function executeSuite(
  definition: SuiteDefinition,
  path: string[],
  state: ExecutionState,
): Promise<RuntimeSuiteResult | undefined> {
  if (!definition.synthetic && !hasMatchingDescendant(definition, path, state.grep)) {
    return undefined;
  }

  const suitePath = definition.synthetic ? path : [...path, definition.title];
  const result = createSuiteResult(definition.title);

  for (const hook of definition.beforeHooks) {
    try {
      await runRunnable(hook.fn, [...suitePath], null, result.log);
    } catch (error) {
      state.summary.failed += 1;
      result.status = "failed";
      result.error = toErrorMessage(error);

      for (const child of getExecutionChildren(definition.children)) {
        if (child.kind === "suite") {
          const childResult = buildCancelledSuite(child, suitePath, state);
          if (childResult) {
            result.children.push(childResult);
          }
          continue;
        }

        if (!matchesPattern(state.grep, buildFullTitle(suitePath, child.title))) {
          continue;
        }

        state.summary.cancelled += 1;
        result.children.push(createCaseResult(child.title, "cancelled"));
      }

      if (state.bail) {
        state.cancelRemaining = true;
      }

      return result;
    }
  }

  for (const child of getExecutionChildren(definition.children)) {
    if (child.kind === "suite") {
      const childResult = state.cancelRemaining
        ? buildCancelledSuite(child, suitePath, state)
        : await executeSuite(child, suitePath, state);

      if (childResult) {
        result.children.push(childResult);
      }
      continue;
    }

    if (!matchesPattern(state.grep, buildFullTitle(suitePath, child.title))) {
      continue;
    }

    const childResult = state.cancelRemaining
      ? (() => {
          state.summary.cancelled += 1;
          return createCaseResult(child.title, "cancelled");
        })()
      : await executeCase(child, suitePath, state);

    result.children.push(childResult);
  }

  result.status = rollupSuiteStatus(result.children);
  return result;
}

export function createDescribeRuntime(options: DescribeRuntimeOptions): DescribeRuntime {
  const rootDefinition: SuiteDefinition = {
    kind: "suite",
    title: options.rootTitle,
    synthetic: true,
    beforeHooks: [],
    children: [],
  };

  const suiteStack: SuiteDefinition[] = [rootDefinition];
  let activeSummary: RuntimeRunSummary | undefined;

  const getCurrentSuite = (): SuiteDefinition => {
    const currentSuite = suiteStack[suiteStack.length - 1];
    if (!currentSuite) {
      throw new Error("Describe runtime lost its active suite stack.");
    }

    return currentSuite;
  };

  const describe = (title: string, build: SuiteBuilder): void => {
    const suite: SuiteDefinition = {
      kind: "suite",
      title,
      synthetic: false,
      beforeHooks: [],
      children: [],
    };

    getCurrentSuite().children.push(suite);
    suiteStack.push(suite);

    try {
      build.call(createMochaContext());
    } finally {
      suiteStack.pop();
    }
  };

  const it = (title: string, fn?: Runnable): void => {
    getCurrentSuite().children.push({
      kind: "case",
      title,
      fn,
    });
  };

  function before(title: string, fn: Runnable): void;
  function before(fn: Runnable): void;
  function before(titleOrFn: string | Runnable, maybeFn?: Runnable): void {
    const title = typeof titleOrFn === "string" ? titleOrFn : "before";
    const fn = typeof titleOrFn === "string" ? maybeFn : titleOrFn;

    if (!fn) {
      throw new Error(`Missing before hook implementation for "${title}".`);
    }

    getCurrentSuite().beforeHooks.push({ title, fn });
  }

  const run = async (): Promise<RuntimeRunResult> => {
    const now = options.now ?? Date.now;
    const startTime = now();
    const summary: RuntimeRunSummary = {
      total: countMatchingCases(rootDefinition, [], options.grep),
      passed: 0,
      failed: 0,
      skipped: 0,
      cancelled: 0,
      version: options.version,
    };
    activeSummary = summary;

    const state: ExecutionState = {
      summary,
      cancelRemaining: false,
      bail: options.bail ?? false,
      grep: options.grep,
    };

    try {
      const root = (await executeSuite(rootDefinition, [], state)) ?? createSuiteResult(options.rootTitle);
      root.title = options.rootTitle;
      root.name = options.rootTitle;
      root.requirement = "";

      const endTime = now();

      return {
        root,
        summary,
        state: state.cancelRemaining && summary.failed === 0 ? "cancelled" : "finished",
        startTime,
        endTime,
        duration: endTime - startTime,
      };
    } finally {
      activeSummary = undefined;
    }
  };

  return {
    before,
    describe,
    getSummary: () => activeSummary,
    it,
    run,
  };
}
