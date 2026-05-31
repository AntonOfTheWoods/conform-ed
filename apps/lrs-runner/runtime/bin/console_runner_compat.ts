#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

import { auth as doOAuth1Auth } from "./OAuth.ts";
import { testRunner as TestRunner } from "./testRunner.ts";
import { parseConsoleRunnerArgv } from "../bun-runtime/cli-args.ts";
import { main as runNativeConsoleRunner } from "../bun-runtime/console-runner.ts";

type RunnerMessage = {
  action?: string;
  payload?: unknown;
};

type CleanLogRecord = {
  title: string;
  name: string;
  requirement: string;
  log: string;
  status: string;
  error?: string;
  tests: CleanLogRecord[];
};

type CleanRunRecord = {
  name: string | null;
  owner: string | null;
  flags: Record<string, unknown>;
  options: Record<string, unknown>;
  rollupRule: string;
  uuid: string;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  state: string;
  summary: {
    total: number | null;
    passed: number | null;
    failed: number | null;
    version?: string;
  };
  log?: CleanLogRecord;
};

type RunnerInstance = {
  cancel(): void;
  duration: number | null;
  getCleanRecord(): CleanRunRecord;
  on(event: "message", listener: (msg: RunnerMessage) => void): void;
  start(): void;
  summary: {
    total: number | null;
    passed: number | null;
    failed: number | null;
    version?: string;
  };
  uuid: string;
};

type OAuthConfig = {
  auth_token_path: string;
  authorization_path: string;
  consumer_key?: string;
  consumer_secret?: string;
  endpoint?: string;
  request_token_path: string;
};

type OAuthResponse = {
  token: string;
  token_secret: string;
  verifier: string;
};

const parsedArgv = parseConsoleRunnerArgv(process.argv.slice(2));

// Keep OAuth compatibility behavior, but route standard usage through the native Bun runner.
if (!parsedArgv.oAuth1) {
  const exitCode = await runNativeConsoleRunner(process.argv.slice(2));
  process.exit(exitCode);
}

const options: Record<string, unknown> = {
  xapiVersion: parsedArgv.xapiVersion,
  endpoint: parsedArgv.endpoint,
  authUser: parsedArgv.authUser,
  authPass: parsedArgv.authPass,
  basicAuth: parsedArgv.basicAuth,
  oAuth1: parsedArgv.oAuth1,
  consumer_key: parsedArgv.consumer_key,
  consumer_secret: parsedArgv.consumer_secret,
  request_token_path: parsedArgv.request_token_path,
  auth_token_path: parsedArgv.auth_token_path,
  authorization_path: parsedArgv.authorization_path,
  grep: parsedArgv.grep,
  bail: parsedArgv.bail,
  directory: parsedArgv.directory ?? [],
  optional: Array.isArray(parsedArgv.optional) && parsedArgv.optional.length > 0 ? parsedArgv.optional : undefined,
  file: Array.isArray(parsedArgv.file) && parsedArgv.file.length > 0 ? parsedArgv.file : undefined,
  errors: parsedArgv.errors,
};

var testRunner: RunnerInstance | null = null;

process.on("SIGINT", function () {
  console.log("Aborting tests.");
  testRunner?.cancel();
});

process.on("exit", function () {
  console.log("Closed");
});

function removeNulls(log: CleanLogRecord | undefined): CleanLogRecord | undefined {
  if (!log || log.status !== "failed") {
    return undefined;
  }

  const tests = log.tests.map(removeNulls).filter((entry): entry is CleanLogRecord => typeof entry !== "undefined");

  return {
    title: log.title,
    name: log.name,
    requirement: log.requirement,
    log: log.log,
    status: log.status,
    error: log.error,
    tests,
  };
}

function start(runnerOptions: Record<string, unknown>): void {
  delete runnerOptions["request_token_path"];
  delete runnerOptions["auth_token_path"];
  delete runnerOptions["authorization_path"];

  testRunner = new TestRunner("console", null, runnerOptions);
  testRunner.start();

  var interval = setInterval(function () {
    if (testRunner) {
      console.log(JSON.stringify(testRunner.summary));
    }
  }, 2000);

  testRunner.on("message", function (msg) {
    if (!testRunner) {
      return;
    }

    if (msg.action === "log") {
      console.log(msg.payload);
    } else if (msg.action === "end") {
      clearInterval(interval);
      console.log(JSON.stringify(testRunner.summary));
      console.log(`Tests completed in ${Number(testRunner.duration ?? 0) / 1000} seconds`);

      const cleanLog = testRunner.getCleanRecord();
      const output = runnerOptions["errors"]
        ? JSON.stringify(
            {
              name: cleanLog.name,
              owner: cleanLog.owner,
              flags: cleanLog.flags,
              options: cleanLog.options,
              rollupRule: cleanLog.rollupRule,
              uuid: cleanLog.uuid,
              startTime: cleanLog.startTime,
              endTime: cleanLog.endTime,
              duration: cleanLog.duration,
              state: cleanLog.state,
              summary: cleanLog.summary,
              log: removeNulls(cleanLog.log),
            },
            null,
            "    ",
          )
        : JSON.stringify(cleanLog, null, "    ");

      const outDir = path.join(__dirname, "../logs");

      fs.mkdir(outDir, { mode: 0o775 }, function () {
        if (!testRunner) {
          process.exit(1);
          return;
        }

        const outPath = path.join(outDir, testRunner.uuid + ".log");
        fs.writeFile(outPath, output, (error) => {
          if (error) {
            console.log(error);
            process.exit(1);
            return;
          }

          console.log("Full run log written to", outPath);
          process.exit(typeof testRunner?.summary.failed === "number" ? testRunner.summary.failed : 1);
        });
      });
    }
  });
}

const config: OAuthConfig = {
  consumer_key: typeof options["consumer_key"] === "string" ? options["consumer_key"] : undefined,
  consumer_secret: typeof options["consumer_secret"] === "string" ? options["consumer_secret"] : undefined,
  request_token_path:
    typeof options["request_token_path"] === "string" ? options["request_token_path"] : "/OAuth/initiate",
  auth_token_path: typeof options["auth_token_path"] === "string" ? options["auth_token_path"] : "/OAuth/token",
  authorization_path:
    typeof options["authorization_path"] === "string"
      ? options["authorization_path"]
      : "/../accounts/login?next=/XAPI/OAuth/authorize",
  endpoint: typeof options["endpoint"] === "string" ? options["endpoint"] : undefined,
};

doOAuth1Auth(config, function (error: unknown, oAuth?: OAuthResponse) {
  if (error || !oAuth) {
    console.log(error);
    return;
  }

  options["token"] = oAuth.token;
  options["token_secret"] = oAuth.token_secret;
  options["verifier"] = oAuth.verifier;
  start(options);
});
