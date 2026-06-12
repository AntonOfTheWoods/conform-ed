import { definedProps } from "./defined-props.ts";
import type { RuntimeNodeResult, RuntimeRunResult } from "./runtime.ts";

export interface RuntimeRunRecordFlags {
  endpoint?: string;
  basicAuth?: boolean;
  authUser?: string;
  oAuth1?: boolean;
  consumer_key?: string;
  grep?: string;
  optional?: string[];
  file?: string[];
}

export interface RuntimeLogRecord {
  title: string;
  name: string;
  requirement: string;
  log: string;
  status: string;
  error?: string;
  tests: RuntimeLogRecord[];
}

export interface RuntimeRunRecord {
  name: string | null;
  owner: string | null;
  flags: RuntimeRunRecordFlags;
  options: Record<string, unknown>;
  lrsSettingsUUID: string | null;
  rollupRule: string;
  uuid: string;
  startTime: number;
  endTime: number;
  duration: number;
  state: string;
  summary: {
    total: number | null;
    passed: number | null;
    failed: number | null;
    version?: string;
  };
  log: RuntimeLogRecord;
}

/** The output form: `--errors` filters the log down and may drop it entirely. */
export type SerializableRunRecord = Omit<RuntimeRunRecord, "log"> & { log?: RuntimeLogRecord };

function toLogRecord(node: RuntimeNodeResult): RuntimeLogRecord {
  return {
    title: node.title,
    name: node.name,
    requirement: node.requirement,
    log: node.log.join(""),
    status: node.status,
    ...definedProps({ error: node.error }),
    tests: node.children.map(toLogRecord),
  };
}

function createUuid(): string {
  return globalThis.crypto.randomUUID();
}

export function createRunRecord(
  runResult: RuntimeRunResult,
  metadata: {
    flags?: RuntimeRunRecordFlags;
    lrsSettingsUUID?: string | null;
    name?: string | null;
    options?: Record<string, unknown>;
    owner?: string | null;
    rollupRule?: string;
    summaryVersion?: string;
    uuid?: string;
  } = {},
): RuntimeRunRecord {
  return {
    name: metadata.name ?? null,
    owner: metadata.owner ?? null,
    flags: metadata.flags ?? {},
    options: metadata.options ?? {},
    lrsSettingsUUID: metadata.lrsSettingsUUID ?? null,
    rollupRule: metadata.rollupRule ?? "mustPassAll",
    uuid: metadata.uuid ?? createUuid(),
    startTime: runResult.startTime,
    endTime: runResult.endTime,
    duration: runResult.duration,
    state: runResult.state,
    summary: {
      total: runResult.summary.total,
      passed: runResult.summary.passed,
      failed: runResult.summary.failed,
      ...definedProps({ version: metadata.summaryVersion ?? runResult.summary.version }),
    },
    log: toLogRecord(runResult.root),
  };
}

export function filterFailedLogRecord(log: RuntimeLogRecord): RuntimeLogRecord | undefined {
  if (log.status !== "failed") {
    return undefined;
  }

  return {
    ...log,
    tests: log.tests.map(filterFailedLogRecord).filter((child): child is RuntimeLogRecord => Boolean(child)),
  };
}

export function createOutputRunRecord(record: RuntimeRunRecord, errorsOnly: boolean): SerializableRunRecord {
  if (!errorsOnly) {
    return record;
  }

  const { log, ...rest } = record;
  const failedLog = filterFailedLogRecord(log);

  return {
    ...rest,
    ...(failedLog ? { log: failedLog } : {}),
  };
}
