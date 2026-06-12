import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { NormalizedRunnerOptions } from "./options.ts";
import type { DescribeRuntime } from "./runtime.ts";

export interface SuiteLoaderOptions {
  normalizedOptions: NormalizedRunnerOptions;
  runtime: DescribeRuntime;
  runtimeRoot: string;
}

type SuiteDescribe = ((title: string, build: () => void) => void) & {
  skip?: (title: string, build: () => void) => void;
};

type SuiteIt = ((title: string, fn?: ((done?: (error?: unknown) => void) => unknown) | (() => unknown)) => void) & {
  skip?: (title: string, fn?: ((done?: (error?: unknown) => void) => unknown) | (() => unknown)) => void;
};

type SuiteBefore = {
  (title: string, fn: (done?: (error?: unknown) => void) => unknown): void;
  (fn: (done?: (error?: unknown) => void) => unknown): void;
};

// Mutable global slots: save/restore writes the possibly-undefined previous
// value back, so these members must admit explicit undefined.
type SuiteGlobalShape = typeof globalThis & {
  context?: SuiteDescribe | undefined;
  describe?: SuiteDescribe | undefined;
  specify?: SuiteIt | undefined;
  it?: SuiteIt | undefined;
  before?: SuiteBefore | undefined;
};

const timeMarginSetupFiles = new Set<string>([
  "test/v1_0_3/Data2.2-FormattingRequirements.js",
  "test/v1_0_3/Data2.2-FormattingRequirements.ts",
  "test/v2_0/Data2.2-FormattingRequirements.js",
  "test/v2_0/Data2.2-FormattingRequirements.ts",
]);

const timeMarginDependentFiles = new Set<string>([
  "test/v1_0_3/H.Communication2.1-StatementResource.js",
  "test/v1_0_3/H.Communication2.3-StateResource.js",
  "test/v1_0_3/H.Communication2.6-AgentProfileResource.js",
  "test/v1_0_3/H.Communication2.7-ActivityProfileResource.js",
  "test/v2_0/4.1.6.1-Statement-Resource.js",
  "test/v2_0/4.1.6.2-State-Resource.js",
  "test/v2_0/4.1.6.5-Agent-Profile-Resource.js",
  "test/v2_0/4.1.6.6-Activity-Profile-Resource.js",
]);

const legacyTsTranspiler = new Bun.Transpiler({ loader: "ts" });
const legacyJsTranspiler = new Bun.Transpiler({ loader: "js" });

export function toPosixPath(pathValue: string): string {
  return pathValue.replaceAll("\\", "/");
}

export function normalizeSelectedFiles(selectedFiles: string[] | undefined): Set<string> | null {
  if (!selectedFiles || selectedFiles.length === 0) {
    return null;
  }

  return new Set(selectedFiles.map((filePath) => toPosixPath(filePath)));
}

function getAlternateSuiteFilePath(relativeFilePath: string): string | null {
  if (relativeFilePath.endsWith(".js")) {
    return `${relativeFilePath.slice(0, -3)}.ts`;
  }

  if (relativeFilePath.endsWith(".ts")) {
    return `${relativeFilePath.slice(0, -3)}.js`;
  }

  return null;
}

function getSuiteSelectionComparisonPath(relativeFilePath: string): string {
  return relativeFilePath.endsWith(".ts") ? `${relativeFilePath.slice(0, -3)}.js` : relativeFilePath;
}

export function isSuiteDefinitionFile(fileName: string): boolean {
  return fileName.endsWith(".js") || fileName.endsWith(".ts");
}

export function matchesSelectedSuiteFile(selectedFiles: Set<string> | null, relativeFilePath: string): boolean {
  if (!selectedFiles) {
    return true;
  }

  if (selectedFiles.has(relativeFilePath)) {
    return true;
  }

  const alternateFilePath = getAlternateSuiteFilePath(relativeFilePath);
  return alternateFilePath ? selectedFiles.has(alternateFilePath) : false;
}

function applyRunnerEnvironment(normalizedOptions: NormalizedRunnerOptions): Array<string | undefined> {
  const previousDirectory = process.env["DIRECTORY"];
  const previousEndpoint = process.env["LRS_ENDPOINT"];
  const previousBasicAuthEnabled = process.env["BASIC_AUTH_ENABLED"];
  const previousBasicAuthUser = process.env["BASIC_AUTH_USER"];
  const previousBasicAuthPassword = process.env["BASIC_AUTH_PASSWORD"];
  const previousOAuthEnabled = process.env["OAUTH1_ENABLED"];
  const previousOAuthConsumerKey = process.env["OAUTH1_CONSUMER_KEY"];
  const previousOAuthConsumerSecret = process.env["OAUTH1_CONSUMER_SECRET"];
  const previousOAuthToken = process.env["OAUTH1_TOKEN"];
  const previousOAuthTokenSecret = process.env["OAUTH1_TOKEN_SECRET"];
  const previousOAuthVerifier = process.env["OAUTH1_VERIFIER"];
  const previousXapiVersion = process.env["XAPI_VERSION"];

  process.env["DIRECTORY"] = normalizedOptions.directory[0] ?? "";
  process.env["LRS_ENDPOINT"] = normalizedOptions.endpoint;
  process.env["BASIC_AUTH_ENABLED"] = String(normalizedOptions.basicAuth);
  process.env["BASIC_AUTH_USER"] = normalizedOptions.authUser ?? "";
  process.env["BASIC_AUTH_PASSWORD"] = normalizedOptions.authPass ?? "";
  process.env["OAUTH1_ENABLED"] = String(normalizedOptions.oAuth1);
  process.env["OAUTH1_CONSUMER_KEY"] = normalizedOptions.consumer_key ?? "";
  process.env["OAUTH1_CONSUMER_SECRET"] = normalizedOptions.consumer_secret ?? "";
  process.env["OAUTH1_TOKEN"] = normalizedOptions.token ?? "";
  process.env["OAUTH1_TOKEN_SECRET"] = normalizedOptions.token_secret ?? "";
  process.env["OAUTH1_VERIFIER"] = normalizedOptions.verifier ?? "";
  process.env["XAPI_VERSION"] = normalizedOptions.xapiVersion;

  return [
    previousDirectory,
    previousEndpoint,
    previousBasicAuthEnabled,
    previousBasicAuthUser,
    previousBasicAuthPassword,
    previousOAuthEnabled,
    previousOAuthConsumerKey,
    previousOAuthConsumerSecret,
    previousOAuthToken,
    previousOAuthTokenSecret,
    previousOAuthVerifier,
    previousXapiVersion,
  ];
}

export function installRunnerEnvironment(normalizedOptions: NormalizedRunnerOptions): () => void {
  const previousValues = applyRunnerEnvironment(normalizedOptions);

  return () => {
    restoreRunnerEnvironment(previousValues);
  };
}

function restoreRunnerEnvironment(previousValues: Array<string | undefined>): void {
  const [
    previousDirectory,
    previousEndpoint,
    previousBasicAuthEnabled,
    previousBasicAuthUser,
    previousBasicAuthPassword,
    previousOAuthEnabled,
    previousOAuthConsumerKey,
    previousOAuthConsumerSecret,
    previousOAuthToken,
    previousOAuthTokenSecret,
    previousOAuthVerifier,
    previousXapiVersion,
  ] = previousValues;

  const restore = (name: string, value: string | undefined): void => {
    if (typeof value === "undefined") {
      delete process.env[name];
      return;
    }

    process.env[name] = value;
  };

  restore("DIRECTORY", previousDirectory);
  restore("LRS_ENDPOINT", previousEndpoint);
  restore("BASIC_AUTH_ENABLED", previousBasicAuthEnabled);
  restore("BASIC_AUTH_USER", previousBasicAuthUser);
  restore("BASIC_AUTH_PASSWORD", previousBasicAuthPassword);
  restore("OAUTH1_ENABLED", previousOAuthEnabled);
  restore("OAUTH1_CONSUMER_KEY", previousOAuthConsumerKey);
  restore("OAUTH1_CONSUMER_SECRET", previousOAuthConsumerSecret);
  restore("OAUTH1_TOKEN", previousOAuthToken);
  restore("OAUTH1_TOKEN_SECRET", previousOAuthTokenSecret);
  restore("OAUTH1_VERIFIER", previousOAuthVerifier);
  restore("XAPI_VERSION", previousXapiVersion);
}

function installSuiteGlobals(runtime: DescribeRuntime): () => void {
  const globalState = globalThis as SuiteGlobalShape;
  const previousDescribe = globalState.describe;
  const previousContext = globalState.context;
  const previousIt = globalState.it;
  const previousSpecify = globalState.specify;
  const previousBefore = globalState.before;

  const describe = Object.assign((title: string, build: () => void) => runtime.describe(title, build), {
    skip: (_title: string, _build: () => void) => {},
  });
  const it = Object.assign(
    (title: string, fn?: ((done?: (error?: unknown) => void) => unknown) | (() => unknown)) => runtime.it(title, fn),
    {
      skip: (title: string) => runtime.it(title),
    },
  );

  globalState.describe = describe as SuiteGlobalShape["describe"];
  globalState.context = describe as SuiteGlobalShape["context"];
  globalState.it = it as SuiteGlobalShape["it"];
  globalState.specify = it as SuiteGlobalShape["specify"];
  globalState.before = runtime.before.bind(runtime) as SuiteGlobalShape["before"];

  return () => {
    globalState.describe = previousDescribe;
    globalState.context = previousContext;
    globalState.it = previousIt;
    globalState.specify = previousSpecify;
    globalState.before = previousBefore;
  };
}

export function getDirectoriesToLoad(normalizedOptions: NormalizedRunnerOptions): string[] {
  const directories = [...normalizedOptions.directory];
  if (normalizedOptions.optional && normalizedOptions.optional.length > 0) {
    for (const optionalDirectory of [...normalizedOptions.optional].reverse()) {
      directories.unshift(optionalDirectory);
    }
  }

  return directories;
}

function preferTypeScriptSuiteEntries(entries: string[]): string[] {
  const preferredByStem = new Map<string, string>();

  for (const entry of entries) {
    const stem = entry.replace(/\.(?:js|ts)$/, "");
    const existing = preferredByStem.get(stem);

    if (!existing) {
      preferredByStem.set(stem, entry);
      continue;
    }

    if (entry.endsWith(".ts") && existing.endsWith(".js")) {
      preferredByStem.set(stem, entry);
    }
  }

  return [...preferredByStem.values()].sort((left, right) => left.localeCompare(right));
}

export function needsTimeMarginBootstrap(selectedFiles: Set<string> | null): boolean {
  if (!selectedFiles || selectedFiles.size === 0) {
    return false;
  }

  let hasDependentFile = false;
  let hasSetupFile = false;

  for (const filePath of selectedFiles) {
    const comparisonFilePath = getSuiteSelectionComparisonPath(filePath);

    if (timeMarginDependentFiles.has(comparisonFilePath)) {
      hasDependentFile = true;
    }

    if (timeMarginSetupFiles.has(comparisonFilePath)) {
      hasSetupFile = true;
    }
  }

  return hasDependentFile && !hasSetupFile;
}

function installSelectedFileBootstrapHooks(options: {
  requireFromRuntimeRoot: NodeJS.Require;
  runtime: DescribeRuntime;
  runtimeRoot: string;
  selectedFiles: Set<string> | null;
}): void {
  if (!needsTimeMarginBootstrap(options.selectedFiles)) {
    return;
  }

  const helperModulePath = resolve(options.runtimeRoot, "test", "helper.ts");

  options.runtime.before("Accounting for time differential between test suite and lrs", (done) => {
    const helperModule = options.requireFromRuntimeRoot(helperModulePath) as {
      default?: {
        setTimeMargin?: (done?: (error?: unknown) => void) => unknown;
      };
      setTimeMargin?: (done?: (error?: unknown) => void) => unknown;
    };

    const helperExports = typeof helperModule.setTimeMargin === "function" ? helperModule : helperModule.default;

    if (!helperExports || typeof helperExports.setTimeMargin !== "function") {
      done();
      return;
    }

    helperExports.setTimeMargin?.(done);
  });
}

function shouldLoadLegacySuiteFile(sourceText: string): boolean {
  if (/^\s*(import|export)\s/m.test(sourceText)) {
    return false;
  }
  return /\bmodule\b/.test(sourceText) || /\brequire\s*\(/.test(sourceText);
}

function shouldUseCommonJsCompatibleTsLoader(sourceText: string): boolean {
  return /module\.exports/.test(sourceText) && !/^\s*(import|export)\s/m.test(sourceText);
}

function normalizeLegacyRequireResult<T>(value: T): T {
  if (value && typeof value === "object" && "default" in (value as Record<string, unknown>)) {
    const defaultValue = (value as Record<string, unknown>)["default"];
    if (typeof defaultValue !== "undefined") {
      return defaultValue as T;
    }
  }

  return value;
}

function normalizeCommonJsCompatibleModuleSource(sourceText: string): string {
  return sourceText.replace(/^\s*export default .*;\s*$/gm, "");
}

function loadCommonJsCompatibleTsModule(absoluteFilePath: string): unknown {
  const sourceText = normalizeCommonJsCompatibleModuleSource(readFileSync(absoluteFilePath, "utf8"));
  const transpiledSource = legacyTsTranspiler.transformSync(sourceText);
  const moduleRecord = { exports: {} as unknown };
  const moduleRequire = createRequire(absoluteFilePath);

  // eslint-disable-next-line typescript/no-implied-eval
  const executeModule = new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    `${transpiledSource}\n//# sourceURL=${absoluteFilePath}`,
  ) as (
    module: { exports: unknown },
    exports: unknown,
    require: NodeJS.Require,
    filename: string,
    dirnameValue: string,
  ) => void;

  executeModule(moduleRecord, moduleRecord.exports, moduleRequire, absoluteFilePath, dirname(absoluteFilePath));
  return moduleRecord.exports;
}

function loadLegacySuiteFile(absoluteFilePath: string, sourceText: string): void {
  const transpiler = absoluteFilePath.endsWith(".ts") ? legacyTsTranspiler : legacyJsTranspiler;
  const transpiledSource = transpiler.transformSync(sourceText);
  const suiteModule = { exports: {} as unknown };
  const suiteRequire = createRequire(absoluteFilePath);
  const legacyRequire = ((specifier: string) => {
    const resolvedPath = suiteRequire.resolve(specifier);
    if (resolvedPath.endsWith(".ts")) {
      const requiredSource = readFileSync(resolvedPath, "utf8");
      if (shouldUseCommonJsCompatibleTsLoader(requiredSource)) {
        return normalizeLegacyRequireResult(loadCommonJsCompatibleTsModule(resolvedPath));
      }

      return normalizeLegacyRequireResult(suiteRequire(specifier));
    }

    return suiteRequire(specifier);
  }) as NodeJS.Require;

  // eslint-disable-next-line typescript/no-implied-eval
  const executeLegacySuite = new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    `${transpiledSource}\n//# sourceURL=${absoluteFilePath}`,
  ) as (
    module: { exports: unknown },
    exports: unknown,
    require: NodeJS.Require,
    filename: string,
    dirnameValue: string,
  ) => void;

  executeLegacySuite(suiteModule, suiteModule.exports, legacyRequire, absoluteFilePath, dirname(absoluteFilePath));
}

async function loadNativeSuiteFile(absoluteFilePath: string): Promise<void> {
  await import(`${pathToFileURL(absoluteFilePath).href}?v=${Date.now()}`);
}

export async function registerSuiteFiles(options: SuiteLoaderOptions): Promise<string[]> {
  const runtimeRoot = options.runtimeRoot;
  const normalizedOptions = options.normalizedOptions;
  const directoriesToLoad = getDirectoriesToLoad(normalizedOptions);
  const selectedFiles = normalizeSelectedFiles(normalizedOptions.file);
  const requireFromRuntimeRoot = createRequire(resolve(runtimeRoot, "package.json"));
  installSelectedFileBootstrapHooks({
    requireFromRuntimeRoot,
    runtime: options.runtime,
    runtimeRoot,
    selectedFiles,
  });
  const restoreGlobals = installSuiteGlobals(options.runtime);
  const loadedFiles: string[] = [];

  try {
    for (const directory of directoriesToLoad) {
      const testDirectory = resolve(runtimeRoot, "test", directory);
      const directoryEntries = preferTypeScriptSuiteEntries(
        readdirSync(testDirectory)
          .filter((entry) => isSuiteDefinitionFile(entry))
          .sort((left, right) => left.localeCompare(right)),
      );

      for (const entry of directoryEntries) {
        const relativeFilePath = toPosixPath(join("test", directory, entry));
        if (!matchesSelectedSuiteFile(selectedFiles, relativeFilePath)) {
          continue;
        }

        const absoluteFilePath = resolve(testDirectory, entry);
        const sourceText = readFileSync(absoluteFilePath, "utf8");

        if (shouldLoadLegacySuiteFile(sourceText)) {
          loadLegacySuiteFile(absoluteFilePath, sourceText);
        } else {
          await loadNativeSuiteFile(absoluteFilePath);
        }
        loadedFiles.push(relativeFilePath);
      }
    }
  } finally {
    restoreGlobals();
  }

  return loadedFiles;
}
