import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import extend from "../bun-runtime/extend-compat.ts";

import * as fixtureCryptoSupportModule from "../bun-runtime/helper-fixture-crypto.ts";
import * as transportSupportModule from "../bun-runtime/helper-transport.ts";
import type { FixtureCryptoContext, HelperFixtureCryptoSupport } from "../bun-runtime/helper-fixture-crypto.ts";
import type { HelperTransportContext, HelperTransportSupport } from "../bun-runtime/helper-transport.ts";

const helperRequire = createRequire(import.meta.url);

type HelperExports = HelperTransportSupport & HelperFixtureCryptoSupport;

type HelperState = {
  CAPTURE_OWNER_HEADER: string;
  CONFIG_FOLDER: string;
  CONFIG_FOLDER_RELATIVE: string;
  DIRECTORY: string;
  LRS_ENDPOINT: string;
  TEMPLATE_FOLDER: string;
  TEMPLATE_FOLDER_RELATIVE: string;
  TIME_MARGIN: number | undefined;
  URL_ABOUT: string;
  URL_ACTIVITIES: string;
  URL_ACTIVITIES_PROFILE: string;
  URL_ACTIVITIES_STATE: string;
  URL_AGENTS: string;
  URL_AGENTS_PROFILE: string;
  URL_STATEMENTS: string;
};

function loadLocalEnvIfNeeded(): void {
  if (process.env["EB_NODE_COMMAND"]) {
    return;
  }

  const envPath = path.join(__dirname, "./.env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.charAt(0) === "#") {
        return;
      }

      const delimiterIndex = trimmed.indexOf("=");
      if (delimiterIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, delimiterIndex).trim();
      if (!key || typeof process.env[key] !== "undefined") {
        return;
      }

      let rawValue = trimmed.slice(delimiterIndex + 1).trim();
      if (
        rawValue.length >= 2 &&
        ((rawValue.charAt(0) === '"' && rawValue.charAt(rawValue.length - 1) === '"') ||
          (rawValue.charAt(0) === "'" && rawValue.charAt(rawValue.length - 1) === "'"))
      ) {
        rawValue = rawValue.slice(1, -1);
      }

      process.env[key] = rawValue;
    });
}

loadLocalEnvIfNeeded();

let timeMargin: number | undefined;
const CAPTURE_OWNER_HEADER = "x-lrs-conformance-owner";

let helperExports: HelperExports;

function getState(): HelperState {
  const directory = process.env["DIRECTORY"] ?? "";

  return {
    CAPTURE_OWNER_HEADER,
    CONFIG_FOLDER: `./test/${directory}/configs`,
    CONFIG_FOLDER_RELATIVE: `./${directory}/configs`,
    DIRECTORY: directory,
    LRS_ENDPOINT: process.env["LRS_ENDPOINT"] ?? "",
    TEMPLATE_FOLDER: `./test/${directory}/templates`,
    TEMPLATE_FOLDER_RELATIVE: `./${directory}/templates`,
    TIME_MARGIN: timeMargin,
    URL_ABOUT: "/about",
    URL_ACTIVITIES: "/activities",
    URL_ACTIVITIES_PROFILE: "/activities/profile",
    URL_ACTIVITIES_STATE: "/activities/state",
    URL_AGENTS: "/agents",
    URL_AGENTS_PROFILE: "/agents/profile",
    URL_STATEMENTS: "/statements",
  };
}

const helperContext: HelperTransportContext & FixtureCryptoContext = {
  crypto,
  extend,
  fs,
  getHelperExports(): HelperExports {
    return helperExports;
  },
  getState,
  helperRequire,
  lodashIsEqual: isDeepStrictEqual,
  setTimeMargin(value: number | undefined): void {
    timeMargin = value;
  },
};

const transportSupport: HelperTransportSupport = transportSupportModule.createHelperTransportSupport(helperContext);
const fixtureSupport: HelperFixtureCryptoSupport =
  fixtureCryptoSupportModule.createHelperFixtureCryptoSupport(helperContext);

helperExports = {
  ...transportSupport,
  ...fixtureSupport,
};

export default helperExports;
