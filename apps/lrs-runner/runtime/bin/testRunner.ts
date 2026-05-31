import crypto from "node:crypto";
import type { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import path from "path";

import specRefs from "../test/references.json";
import { versionNumber } from "../version.ts";
import rollup from "./rollupRules.ts";
import type { SuiteLike as RollupSuiteLike, SuiteStatus as RollupSuiteStatus } from "./rollupRules.ts";

import childProcess from "child_process";

type SuiteStatus = "" | "cancelled" | "passed" | "failed";
type RunnerState = "notStarted" | "started" | "finished" | "cancelled" | "error";

type RunnerFlags = {
  xapiVersion?: string;
  endpoint?: string;
  basicAuth?: boolean;
  authUser?: string;
  authPass?: string;
  oAuth1?: boolean;
  consumer_key?: string;
  consumer_secret?: string;
  grep?: string;
  optional?: string[];
  [key: string]: unknown;
};

type RunnerOptions = {
  grep?: string;
  optional?: string[];
  [key: string]: unknown;
};

type RunnerMessage = {
  action: string;
  payload?: unknown;
};

type CleanLogRecord = {
  title: string;
  name: string;
  requirement: string;
  log: string;
  status: SuiteStatus;
  error?: string;
  tests: CleanLogRecord[];
};

type CleanRunRecord = {
  name: string | null;
  owner: string | null;
  flags: {
    endpoint?: string;
    basicAuth?: boolean;
    authUser?: string;
    oAuth1?: boolean;
    consumer_key?: string;
    grep?: string;
    optional?: string[];
  };
  options: RunnerOptions;
  lrsSettingsUUID: string | null;
  rollupRule: string;
  uuid: string;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  state: RunnerState;
  summary: {
    total: number | null;
    passed: number | null;
    failed: number | null;
    version?: string;
  };
  log?: CleanLogRecord;
};

type SpecReference = {
  "1.0.3_link"?: string | string[];
  "1.0.3_ref"?: string | string[];
};

const specReferenceMap = specRefs as unknown as Record<string, SpecReference>;
const rollupRuleMap = rollup as Record<string, (suite: RollupSuiteLike) => RollupSuiteStatus>;

function normalizeReferenceLink(value: SpecReference["1.0.3_link"]): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return undefined;
}

function normalizeReferenceId(value: SpecReference["1.0.3_ref"]): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return undefined;
}

export class Suite {
  title: string;
  log = "";
  name: string;
  requirement: string;
  status: SuiteStatus = "";
  parent: Suite | null = null;
  tests: Suite[] = [];
  error?: string;

  constructor(title: string) {
    const match = /\(([^)]*\d[^)]*)\)/.exec(title);

    this.title = title;
    if (match) {
      this.name = title.slice(0, match.index).trim();
      const reference = specReferenceMap[this.name];
      this.requirement =
        normalizeReferenceLink(reference?.["1.0.3_link"]) ??
        normalizeReferenceId(reference?.["1.0.3_ref"]) ??
        match[1] ??
        "";
    } else {
      this.name = title;
      this.requirement = "";
    }
  }

  addTest(test: Suite): void {
    this.tests.push(test);
    test.parent = this;
  }

  _log(data: unknown): void {
    this.log += String(data);
  }
}

export class TestRunner extends EventEmitter {
  proc: ChildProcess | null = null;
  name: string | null;
  owner: string | null;
  flags: RunnerFlags;
  options: RunnerOptions;
  lrsSettingsUUID: string | null;
  rollupRule: string;
  xapiVersion: string | undefined;
  uuid: string;
  startTime: number | null = null;
  endTime: number | null = null;
  duration: number | null = null;
  state: RunnerState = "notStarted";
  summary: {
    total: number | null;
    passed: number | null;
    failed: number | null;
    version?: string;
  } = {
    total: null,
    passed: null,
    failed: null,
  };
  log: Suite | null = null;
  activeTest: Suite | null = null;

  constructor(
    name: string | null | undefined,
    owner: string | null | undefined,
    flags: RunnerFlags,
    lrsSettingsUUID?: string | null,
    options?: RunnerOptions,
    rollupRule?: string,
  ) {
    super();

    this.name = name || null;
    this.owner = owner || null;
    this.flags = flags;
    this.options = options || {};
    this.lrsSettingsUUID = lrsSettingsUUID || null;
    this.rollupRule = rollupRule && rollupRuleMap[rollupRule] ? rollupRule : "mustPassAll";
    this.xapiVersion = typeof flags.xapiVersion === "string" ? flags.xapiVersion : versionNumber;
    this.uuid = crypto.randomUUID();
  }

  static resolveLrsTestEntryPath(dirname: string): string {
    return path.join(dirname, "lrs-test.ts");
  }

  start(): void {
    if (this.state !== "notStarted") {
      return;
    }

    this.state = "started";
    this.proc = childProcess.fork(TestRunner.resolveLrsTestEntryPath(__dirname), ["--debug"], {
      execArgv: [],
      cwd: path.join(__dirname, "/../"),
    });

    this._registerStatusUpdates();

    this.proc.on("message", (message: unknown) => {
      const msg = message as RunnerMessage;
      if (msg.action !== "ready") {
        return;
      }

      const flags = JSON.parse(JSON.stringify(this.flags)) as RunnerFlags;
      if (this.options.grep) {
        flags.grep = this.options.grep;
      }
      if (this.options.optional) {
        flags.optional = this.options.optional;
      }

      this.proc?.send({ action: "runTests", payload: flags });
    });
  }

  _registerStatusUpdates(): void {
    if (!this.proc) {
      return;
    }

    this.proc.on("message", (message: unknown) => {
      const msg = message as RunnerMessage;
      const action = msg.action;
      const payload = msg.payload;

      switch (action) {
        case "start":
          this.summary.total = typeof payload === "number" ? payload : Number(payload);
          this.summary.passed = 0;
          this.summary.failed = 0;
          this.startTime = Date.now();
          this.summary.version = this.xapiVersion;
          break;

        case "data":
          if (this.activeTest) {
            this.activeTest._log(payload);
          }
          break;

        case "end":
          this.endTime = Date.now();
          this.duration = this.startTime === null ? null : this.endTime - this.startTime;
          this.state = "finished";
          break;

        case "suite start": {
          // eslint-disable-next-line typescript/no-base-to-string
          const newSuite = new Suite(String(payload ?? ""));
          if (this.activeTest) {
            this.activeTest.addTest(newSuite);
          } else {
            this.log = newSuite;
          }
          this.activeTest = newSuite;
          break;
        }

        case "suite end":
          if (this.activeTest) {
            if (this.activeTest.title === payload) {
              this.activeTest.status = this.rollupSuite(this.activeTest);
              this.activeTest = this.activeTest.parent;
            } else {
              console.error("Dangling suite end!", this.activeTest.title);
            }
          }
          break;

        case "test start": {
          // eslint-disable-next-line typescript/no-base-to-string
          const newTest = new Suite(String(payload ?? ""));
          if (this.activeTest) {
            this.activeTest.addTest(newTest);
          } else {
            this.log = newTest;
          }
          this.activeTest = newTest;
          break;
        }

        case "test end":
          if (this.activeTest) {
            if (this.activeTest.title === payload) {
              this.activeTest = this.activeTest.parent;
            } else {
              console.error("Dangling test end!", this.activeTest.title);
            }
          }
          break;

        case "test pass":
          if (this.activeTest) {
            this.activeTest.status = "passed";
            this.summary.passed = (this.summary.passed || 0) + 1;
          }
          break;

        case "test fail":
          if (this.activeTest) {
            const failure = payload as { message?: unknown };
            this.activeTest.status = "failed";
            // eslint-disable-next-line typescript/no-base-to-string
            this.activeTest.error = String(failure?.message ?? "");
            this.summary.failed = (this.summary.failed || 0) + 1;
          }
          break;

        default:
          break;
      }

      this.emit("message", msg);
    });

    this.proc.on("close", () => {
      if (this.state === "cancelled" || this.state === "finished") {
        return;
      }

      this.state = "error";
      this.emit("message", { action: "end" });
      this.emit("close");
    });
  }

  cancel(): void {
    if (!this.proc) {
      return;
    }

    this.endTime = Date.now();
    this.duration = this.startTime === null ? null : this.endTime - this.startTime;
    this.state = "cancelled";
    this.proc.kill();

    if (this.activeTest) {
      this.activeTest.status = "cancelled";
      this.activeTest = this.activeTest.parent;
    }

    while (this.activeTest) {
      this.activeTest.status = this.rollupSuite(this.activeTest);
      this.emit("message", { action: "suite end", payload: this.activeTest.title });
      this.activeTest = this.activeTest.parent;
    }

    this.emit("message", { action: "end" });
    this.emit("close");
  }

  getCleanRecord(): CleanRunRecord {
    const runRecord: CleanRunRecord = {
      name: this.name,
      owner: this.owner,
      flags: {
        endpoint: this.flags.endpoint,
        basicAuth: this.flags.basicAuth,
        authUser: this.flags.authUser,
        oAuth1: this.flags.oAuth1,
        consumer_key: this.flags.consumer_key,
        grep: this.flags.grep,
        optional: this.flags.optional,
      },
      options: this.options,
      lrsSettingsUUID: this.lrsSettingsUUID,
      rollupRule: this.rollupRule,
      uuid: this.uuid,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      state: this.state,
      summary: {
        total: this.summary.total,
        passed: this.summary.passed,
        failed: this.summary.failed,
        version: this.xapiVersion,
      },
    };

    const cleanLog = (log: Suite | null): CleanLogRecord | undefined => {
      if (!log) {
        return undefined;
      }

      return {
        title: log.title,
        name: log.name,
        requirement: log.requirement,
        log: log.log,
        status: log.status,
        error: log.error,
        tests: log.tests
          .map((child) => cleanLog(child))
          .filter((child): child is CleanLogRecord => child !== undefined),
      };
    };

    const cleanRootLog = cleanLog(this.log);
    if (cleanRootLog) {
      runRecord.log = cleanRootLog;
    }

    return runRecord;
  }

  private rollupSuite(suite: Suite): SuiteStatus {
    const rollupFn = rollupRuleMap[this.rollupRule];
    return typeof rollupFn === "function" ? rollupFn(suite) : "";
  }
}

export function resolveLrsTestEntryPath(dirname: string): string {
  return TestRunner.resolveLrsTestEntryPath(dirname);
}

export const testRunner = TestRunner;
