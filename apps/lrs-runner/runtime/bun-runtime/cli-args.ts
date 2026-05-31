import type { RunnerInputOptions } from "./options.ts";

export interface ConsoleRunnerOptions extends RunnerInputOptions {}

export class ConsoleRunnerArgsError extends Error {}

type BooleanOptionKey = "basicAuth" | "oAuth1" | "bail" | "errors";
type ValueOptionKey =
  | "xapiVersion"
  | "endpoint"
  | "authUser"
  | "authPass"
  | "consumer_key"
  | "consumer_secret"
  | "request_token_path"
  | "auth_token_path"
  | "authorization_path"
  | "grep"
  | "directory"
  | "optional"
  | "file";

type FlagDefinition =
  | {
      key: BooleanOptionKey;
      expectsValue: false;
    }
  | {
      key: ValueOptionKey;
      expectsValue: true;
    };

const flagDefinitions: Record<string, FlagDefinition> = {
  "-x": { key: "xapiVersion", expectsValue: true },
  "--xapiVersion": { key: "xapiVersion", expectsValue: true },
  "-e": { key: "endpoint", expectsValue: true },
  "--endpoint": { key: "endpoint", expectsValue: true },
  "-u": { key: "authUser", expectsValue: true },
  "--authUser": { key: "authUser", expectsValue: true },
  "-p": { key: "authPass", expectsValue: true },
  "--authPassword": { key: "authPass", expectsValue: true },
  "-a": { key: "basicAuth", expectsValue: false },
  "--basicAuth": { key: "basicAuth", expectsValue: false },
  "-o": { key: "oAuth1", expectsValue: false },
  "--oAuth1": { key: "oAuth1", expectsValue: false },
  "-c": { key: "consumer_key", expectsValue: true },
  "--consumer_key": { key: "consumer_key", expectsValue: true },
  "-s": { key: "consumer_secret", expectsValue: true },
  "--consumer_secret": { key: "consumer_secret", expectsValue: true },
  "-r": { key: "request_token_path", expectsValue: true },
  "--request_token_path": { key: "request_token_path", expectsValue: true },
  "-t": { key: "auth_token_path", expectsValue: true },
  "--auth_token_path": { key: "auth_token_path", expectsValue: true },
  "-l": { key: "authorization_path", expectsValue: true },
  "--authorization_path": { key: "authorization_path", expectsValue: true },
  "-g": { key: "grep", expectsValue: true },
  "--grep": { key: "grep", expectsValue: true },
  "-b": { key: "bail", expectsValue: false },
  "--bail": { key: "bail", expectsValue: false },
  "-d": { key: "directory", expectsValue: true },
  "--directory": { key: "directory", expectsValue: true },
  "-m": { key: "optional", expectsValue: true },
  "--optional": { key: "optional", expectsValue: true },
  "-f": { key: "file", expectsValue: true },
  "--file": { key: "file", expectsValue: true },
  "-z": { key: "errors", expectsValue: false },
  "--errors": { key: "errors", expectsValue: false },
};

function splitFlagToken(token: string): { flag: string; inlineValue?: string } {
  const equalsIndex = token.indexOf("=");
  if (equalsIndex === -1) {
    return { flag: token };
  }

  return {
    flag: token.slice(0, equalsIndex),
    inlineValue: token.slice(equalsIndex + 1),
  };
}

function parseCsvValue(value: string): string[] {
  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function assignValue(options: ConsoleRunnerOptions, key: ValueOptionKey, value: string): void {
  if (key === "directory" || key === "optional" || key === "file") {
    options[key] = parseCsvValue(value);
    return;
  }

  switch (key) {
    case "xapiVersion":
    case "endpoint":
    case "authUser":
    case "authPass":
    case "consumer_key":
    case "consumer_secret":
    case "request_token_path":
    case "auth_token_path":
    case "authorization_path":
    case "grep":
      options[key] = value;
      return;
    default: {
      const exhaustiveCheck: never = key;
      return exhaustiveCheck;
    }
  }
}

export function parseConsoleRunnerArgv(argv: string[]): ConsoleRunnerOptions {
  const options: ConsoleRunnerOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    const { flag, inlineValue } = splitFlagToken(token);
    const definition = flagDefinitions[flag];
    if (!definition) {
      throw new ConsoleRunnerArgsError(`Unknown console runner flag: ${flag}`);
    }

    if (!definition.expectsValue) {
      switch (definition.key) {
        case "basicAuth":
        case "oAuth1":
        case "bail":
        case "errors":
          options[definition.key] = true;
          break;
      }
      continue;
    }

    const value = inlineValue ?? argv[index + 1];
    if (!value) {
      throw new ConsoleRunnerArgsError(`Flag ${flag} requires a value.`);
    }

    if (inlineValue === undefined) {
      index += 1;
    }

    assignValue(options, definition.key, value);
  }

  return options;
}
