#!/usr/bin/env bun

import {
  normalizeRunnerOptions,
  RunnerOptionsError,
  type NormalizedRunnerOptions,
  type RunnerInputOptions,
} from "../bun-runtime/options.ts";
import { runConsoleRunnerArgv } from "../bun-runtime/console-runner.ts";
import { defaultXapiVersion } from "../bun-runtime/spec-config.ts";
import { getDirectoriesToLoad, needsTimeMarginBootstrap, normalizeSelectedFiles } from "../bun-runtime/suite-loader.ts";

type ChildProcessShape = NodeJS.Process & {
  postMessage?: (action: string, payload?: unknown) => void;
  send?: (message: { action: string; payload?: unknown }) => void;
};

type RawOptions = {
  xapiVersion?: string;
  directory?: string[];
  endpoint?: string;
  grep?: string;
  optional?: string[];
  file?: string[];
  basicAuth?: boolean | string;
  oAuth1?: boolean | string;
  authUser?: string;
  authPass?: string;
  consumer_key?: string;
  consumer_secret?: string;
  token?: string;
  token_secret?: string;
  verifier?: string;
  reporter?: string;
  bail?: boolean;
  errors?: boolean;
  [key: string]: unknown;
};

function coerceBooleanOption(value: boolean | string | undefined): boolean | undefined {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return undefined;
}

function hasExplicitSuiteSelection(options: RawOptions): boolean {
  return typeof options.xapiVersion === "string" || (Array.isArray(options.directory) && options.directory.length > 0);
}

const ALLOWED_RAW_OPTION_KEYS = new Set<string>([
  "xapiVersion",
  "directory",
  "endpoint",
  "grep",
  "optional",
  "file",
  "basicAuth",
  "oAuth1",
  "authUser",
  "authPass",
  "consumer_key",
  "consumer_secret",
  "token",
  "token_secret",
  "verifier",
  "reporter",
  "bail",
  "errors",
]);

const ALLOWED_REPORTERS = new Set<string>(["dot", "spec", "nyan", "tap", "List", "progress", "min", "doc"]);

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(function (entry) {
      return typeof entry === "string";
    })
  );
}

function isBooleanLike(value: unknown): boolean {
  return value === true || value === false || value === "true" || value === "false";
}

function validateRawOptions(raw: RawOptions): string | null {
  const unknownKeys = Object.keys(raw).filter(function (key) {
    return !ALLOWED_RAW_OPTION_KEYS.has(key);
  });

  if (unknownKeys.length > 0) {
    return `Unknown option(s): ${unknownKeys.join(", ")}`;
  }

  if (typeof raw.endpoint !== "string" || !/^[a-zA-Z][a-zA-Z0-9+.-]*:.+/.test(raw.endpoint)) {
    return "endpoint must be a URI";
  }

  if (typeof raw.xapiVersion !== "undefined" && typeof raw.xapiVersion !== "string") {
    return "xapiVersion must be a string";
  }

  if (typeof raw.grep !== "undefined" && typeof raw.grep !== "string") {
    return "grep must be a string";
  }

  if (typeof raw.directory !== "undefined" && !isStringArray(raw.directory)) {
    return "directory must be an array of strings";
  }

  if (typeof raw.optional !== "undefined" && !isStringArray(raw.optional)) {
    return "optional must be an array of strings";
  }

  if (typeof raw.file !== "undefined" && !isStringArray(raw.file)) {
    return "file must be an array of strings";
  }

  if (typeof raw.reporter !== "undefined") {
    if (typeof raw.reporter !== "string") {
      return "reporter must be a string";
    }
    if (!ALLOWED_REPORTERS.has(raw.reporter)) {
      return `reporter must be one of: ${Array.from(ALLOWED_REPORTERS).join(", ")}`;
    }
  }

  if (typeof raw.bail !== "undefined" && typeof raw.bail !== "boolean") {
    return "bail must be a boolean";
  }

  if (typeof raw.errors !== "undefined" && typeof raw.errors !== "boolean") {
    return "errors must be a boolean";
  }

  if (typeof raw.basicAuth !== "undefined" && !isBooleanLike(raw.basicAuth)) {
    return "basicAuth must be boolean-like";
  }

  if (typeof raw.oAuth1 !== "undefined" && !isBooleanLike(raw.oAuth1)) {
    return "oAuth1 must be boolean-like";
  }

  const basicAuthEnabled = raw.basicAuth === true || raw.basicAuth === "true";
  if (basicAuthEnabled && (typeof raw.authUser !== "string" || typeof raw.authPass !== "string")) {
    return "authUser and authPass are required when basicAuth is true";
  }

  const oauthEnabled = raw.oAuth1 === true || raw.oAuth1 === "true";
  if (oauthEnabled) {
    if (
      typeof raw.consumer_key !== "string" ||
      typeof raw.consumer_secret !== "string" ||
      typeof raw.token !== "string" ||
      typeof raw.token_secret !== "string" ||
      typeof raw.verifier !== "string"
    ) {
      return "consumer_key, consumer_secret, token, token_secret, and verifier are required when oAuth1 is true";
    }
  }

  return null;
}

export function normalizeLrsTestOptions(options: RawOptions): NormalizedRunnerOptions {
  const runnerInputOptions: RunnerInputOptions = {
    xapiVersion: options.xapiVersion,
    directory: options.directory,
    endpoint: typeof options.endpoint === "string" ? options.endpoint : undefined,
    grep: options.grep,
    optional: options.optional,
    file: options.file,
    basicAuth: coerceBooleanOption(options.basicAuth),
    authUser: options.authUser,
    authPass: options.authPass,
    oAuth1: coerceBooleanOption(options.oAuth1),
    consumer_key: options.consumer_key,
    consumer_secret: options.consumer_secret,
    token: options.token,
    token_secret: options.token_secret,
    verifier: options.verifier,
    bail: options.bail,
    errors: options.errors,
  };

  return normalizeRunnerOptions(runnerInputOptions);
}

export function buildLrsTestLoadPlan(normalizedOptions: NormalizedRunnerOptions): {
  directoriesToLoad: string[];
  needsTimeMarginBootstrap: boolean;
  selectedFiles: Set<string> | null;
} {
  const selectedFiles = normalizeSelectedFiles(normalizedOptions.file);

  return {
    directoriesToLoad: getDirectoriesToLoad(normalizedOptions),
    needsTimeMarginBootstrap: needsTimeMarginBootstrap(selectedFiles),
    selectedFiles,
  };
}

export function shouldUseCommonJsCompatibleTsLoader(sourceText: string): boolean {
  return /module\.exports/.test(sourceText) && !/^\s*(import|export)\s/m.test(sourceText);
}

export function normalizeLegacyRequireResult<T>(value: T): T {
  if (value && typeof value === "object" && "default" in (value as Record<string, unknown>)) {
    const defaultValue = (value as Record<string, unknown>)["default"];
    if (typeof defaultValue !== "undefined") {
      return defaultValue as T;
    }
  }

  return value;
}

function buildNativeRunnerArgv(normalizedOptions: NormalizedRunnerOptions): string[] {
  const args: string[] = ["--endpoint", normalizedOptions.endpoint];

  if (normalizedOptions.directory.length > 0) {
    args.push("--directory", normalizedOptions.directory.join(","));
  }

  if (normalizedOptions.grep) {
    args.push("--grep", normalizedOptions.grep);
  }

  if (normalizedOptions.optional && normalizedOptions.optional.length > 0) {
    args.push("--optional", normalizedOptions.optional.join(","));
  }

  if (normalizedOptions.file && normalizedOptions.file.length > 0) {
    args.push("--file", normalizedOptions.file.join(","));
  }

  if (normalizedOptions.basicAuth) {
    args.push("--basicAuth");
  }
  if (normalizedOptions.authUser) {
    args.push("--authUser", normalizedOptions.authUser);
  }
  if (normalizedOptions.authPass) {
    args.push("--authPassword", normalizedOptions.authPass);
  }

  if (normalizedOptions.oAuth1) {
    args.push("--oAuth1");
  }
  if (normalizedOptions.consumer_key) {
    args.push("--consumer_key", normalizedOptions.consumer_key);
  }
  if (normalizedOptions.consumer_secret) {
    args.push("--consumer_secret", normalizedOptions.consumer_secret);
  }
  if (normalizedOptions.token) {
    args.push("--token", normalizedOptions.token);
  }
  if (normalizedOptions.token_secret) {
    args.push("--token_secret", normalizedOptions.token_secret);
  }
  if (normalizedOptions.verifier) {
    args.push("--verifier", normalizedOptions.verifier);
  }

  if (normalizedOptions.bail) {
    args.push("--bail");
  }
  if (normalizedOptions.errors) {
    args.push("--errors");
  }

  return args;
}

async function runTests(_options: RawOptions): Promise<void> {
  const childProcessHandle = process as ChildProcessShape;

  const validationError = validateRawOptions(_options);
  if (validationError) {
    childProcessHandle.postMessage?.("log", "Options not valid " + validationError);
    process.exit(1);
  }
  const shouldWarnAboutDefaultVersion = !hasExplicitSuiteSelection(_options);

  let normalizedOptions: NormalizedRunnerOptions;
  try {
    normalizedOptions = normalizeLrsTestOptions(_options);
  } catch (error) {
    const message = error instanceof RunnerOptionsError ? error.message : String(error);
    console.error(message);
    if (message === "You must specify an endpoint (-e or --endpoint) for your LRS.") {
      console.error("LRS endpoints typically have the form: https://lrs.net/xapi.");
    }
    process.exit(1);
  }

  if (shouldWarnAboutDefaultVersion) {
    console.warn(`No xAPI version or manual path specified -- defaulting to ${defaultXapiVersion}.`);
  }

  console.log(`
            \r\bAttempting xAPI Conformance Suite Against:
            \r\r    xAPI Version: ${normalizedOptions.xapiVersion}
            \r\r    Test Path(s): ${normalizedOptions.directory.join(", ")}
            \r\r    LRS Endpoint: ${normalizedOptions.endpoint}
        `);

  console.log("Grep is " + (normalizedOptions.grep ?? "undefined"));
  const execution = await runConsoleRunnerArgv(buildNativeRunnerArgv(normalizedOptions), {
    cwd: `${import.meta.dir}/..`,
    runnerMode: "native",
    logger: console,
  });

  childProcessHandle.postMessage?.("log", "Test Suite Complete");
  childProcessHandle.postMessage?.("end", "All done");
  process.exit(execution.exitCode);
}

function hookupIPC(): void {
  const childProcessHandle = process as ChildProcessShape;
  childProcessHandle.postMessage = function (action, payload) {
    childProcessHandle.send?.({
      action: action,
      payload: payload,
    });
  };
  process.on("message", function (message: { action?: string; payload?: RawOptions }) {
    if (message.action === "ping") {
      childProcessHandle.postMessage?.("log", "pong");
    } else if (message.action === "runTests") {
      childProcessHandle.postMessage?.("log", "runTests starting");
      void runTests(message.payload ?? {}).catch((error) => {
        console.error(error);
        process.exit(1);
      });
    }
  });
  childProcessHandle.postMessage?.("ready");
}

hookupIPC();
