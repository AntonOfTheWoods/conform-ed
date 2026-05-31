import {
  defaultXapiVersion,
  getSpecFromFolder,
  resolveXapiVersionFolder,
  type SupportedXapiVersion,
} from "./spec-config.ts";

export interface RunnerInputOptions {
  xapiVersion?: string;
  directory?: string[];
  optional?: string[];
  file?: string[];
  endpoint?: string;
  grep?: string;
  basicAuth?: boolean;
  authUser?: string;
  authPass?: string;
  oAuth1?: boolean;
  consumer_key?: string;
  consumer_secret?: string;
  token?: string;
  token_secret?: string;
  verifier?: string;
  request_token_path?: string;
  auth_token_path?: string;
  authorization_path?: string;
  bail?: boolean;
  errors?: boolean;
}

export interface NormalizedRunnerOptions {
  xapiVersion: SupportedXapiVersion;
  directory: string[];
  optional?: string[];
  file?: string[];
  endpoint: string;
  grep?: string;
  basicAuth: boolean;
  authUser?: string;
  authPass?: string;
  oAuth1: boolean;
  consumer_key?: string;
  consumer_secret?: string;
  token?: string;
  token_secret?: string;
  verifier?: string;
  request_token_path?: string;
  auth_token_path?: string;
  authorization_path?: string;
  bail: boolean;
  errors: boolean;
}

export class RunnerOptionsError extends Error {}

function isUriLike(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:.+/.test(value);
}

function normalizeStringArray(values: string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  const normalized = [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
  return normalized.length > 0 ? normalized : undefined;
}

function inferXapiVersionFromDirectories(directories: string[]): SupportedXapiVersion {
  let matchedVersion: SupportedXapiVersion | undefined;

  for (const directory of directories) {
    const directoryVersion = getSpecFromFolder(directory);
    if (!directoryVersion) {
      continue;
    }

    if (!matchedVersion) {
      matchedVersion = directoryVersion;
      continue;
    }

    if (matchedVersion !== directoryVersion) {
      throw new RunnerOptionsError(
        `Multiple directories specified which refer to different versions of the xAPI spec: ${directoryVersion} vs. ${matchedVersion}`,
      );
    }
  }

  if (!matchedVersion) {
    throw new RunnerOptionsError(
      `Unable to determine which version of xAPI to test against with directories: ${directories.join(", ")}`,
    );
  }

  return matchedVersion;
}

export function normalizeRunnerOptions(input: RunnerInputOptions): NormalizedRunnerOptions {
  if (!input.endpoint) {
    throw new RunnerOptionsError("You must specify an endpoint (-e or --endpoint) for your LRS.");
  }

  if (!isUriLike(input.endpoint)) {
    throw new RunnerOptionsError(`Endpoint must be a URI: ${input.endpoint}`);
  }

  const directory = normalizeStringArray(input.directory);
  const optional = normalizeStringArray(input.optional);
  const file = normalizeStringArray(input.file);
  const versionSpecified = typeof input.xapiVersion === "string" && input.xapiVersion.length > 0;
  const directorySpecified = Array.isArray(directory) && directory.length > 0;

  if (directorySpecified && versionSpecified) {
    throw new RunnerOptionsError("Cannot specify both an xAPI Version and a Directory.");
  }

  let xapiVersion: SupportedXapiVersion;
  let resolvedDirectories: string[];

  if (versionSpecified) {
    const resolvedDirectory = resolveXapiVersionFolder(input.xapiVersion!);
    if (!resolvedDirectory) {
      throw new RunnerOptionsError(
        `Unknown version of the xAPI spec: ${input.xapiVersion}. Unable to find appropriate test suite.`,
      );
    }

    xapiVersion = resolvedDirectory === "v1_0_3" ? "1.0.3" : "2.0.0";
    resolvedDirectories = [resolvedDirectory];
  } else if (directorySpecified) {
    resolvedDirectories = [...directory!];
    xapiVersion = inferXapiVersionFromDirectories(resolvedDirectories);
  } else {
    xapiVersion = defaultXapiVersion;
    resolvedDirectories = [resolveXapiVersionFolder(defaultXapiVersion)!];
  }

  return {
    xapiVersion,
    directory: resolvedDirectories,
    optional,
    file,
    endpoint: input.endpoint,
    grep: input.grep,
    basicAuth: input.basicAuth ?? false,
    authUser: input.authUser,
    authPass: input.authPass,
    oAuth1: input.oAuth1 ?? false,
    consumer_key: input.consumer_key,
    consumer_secret: input.consumer_secret,
    token: input.token,
    token_secret: input.token_secret,
    verifier: input.verifier,
    request_token_path: input.request_token_path,
    auth_token_path: input.auth_token_path,
    authorization_path: input.authorization_path,
    bail: input.bail ?? false,
    errors: input.errors ?? false,
  };
}
