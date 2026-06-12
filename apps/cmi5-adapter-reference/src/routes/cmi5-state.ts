import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type ImportedPackage = {
  auCount: number;
  packageId: string;
  packageTitle: string;
  manifestIdentifier: string;
  manifestVersion: string;
  byteLength: number;
  importedAt: string;
};

type LaunchRecord = {
  launchId: string;
  packageId: string;
  registrationId: string;
  sessionId: string;
  learnerId: string;
  launchUrl: string;
  launchMode: string;
  moveOn: string;
  masteryScore: number;
  launchParameters: string;
  activityId: string;
  entitlementKey: string;
  createdAt: string;
};

type WaivedRegistrationRecord = {
  waivedAt: string;
};

type AbandonedSessionRecord = {
  abandonedAt: string;
};

type RequestReplayRecord = {
  requestIds: string[];
  sessionId: string;
};

type LaunchAccessRecord = {
  authExpiresAt: string | null;
  authIssuedAt: string | null;
  authToken: string | null;
  authTokenId: string | null;
  authUseCount: number;
  fetchConsumedAt: string | null;
  fetchExpiresAt: string;
  fetchToken: string;
};

type PersistedCmi5State = {
  abandonedSessions: Array<{ abandonedAt: string; sessionId: string }>;
  importedPackages: ImportedPackage[];
  launchAccessBySession: Array<{ access: LaunchAccessRecord; sessionId: string }>;
  launchesBySession: Array<{ launch: LaunchRecord; sessionId: string }>;
  registrations: string[];
  requestReplayBySession: RequestReplayRecord[];
  sessionStatements: Array<{ sessionId: string; statements: SessionStatementRecord[] }>;
  waivedRegistrations: Array<{ registrationId: string; waivedAt: string }>;
};

type AuthValidationResult =
  | {
      launch: LaunchRecord;
      ok: true;
      sessionId: string;
    }
  | {
      code: string;
      message: string;
      ok: false;
      status: number;
    };

export type SessionStatementVerb =
  | "initialized"
  | "launched"
  | "progressed"
  | "completed"
  | "passed"
  | "failed"
  | "terminated";

export type SessionStatementRecord = {
  statementId: string;
  verb: SessionStatementVerb;
  sessionId: string;
  registrationId: string;
  timestamp: string;
  sequence: number;
};

export type SessionLifecycleStatus = {
  completed: boolean;
  failed: boolean;
  launched: boolean;
  moveOnSatisfied: boolean;
  passed: boolean;
  progressed: boolean;
  terminated: boolean;
};

const importedPackages = new Map<string, ImportedPackage>();
const launchesBySession = new Map<string, LaunchRecord>();
const launchAccessBySession = new Map<string, LaunchAccessRecord>();
const requestReplayBySession = new Map<string, Set<string>>();
const sessionStatements = new Map<string, SessionStatementRecord[]>();
const registrations = new Set<string>();
const waivedRegistrations = new Map<string, WaivedRegistrationRecord>();
const abandonedSessions = new Map<string, AbandonedSessionRecord>();

function stateFilePath(): string {
  const configuredPath = process.env["CMI5_STATE_FILE_PATH"]?.trim();
  if (configuredPath && configuredPath.length > 0) {
    return resolve(configuredPath);
  }

  return resolve(process.cwd(), "tmp", "agents", "cmi5-adapter-reference-state.json");
}

function clearInMemoryState(): void {
  importedPackages.clear();
  launchesBySession.clear();
  launchAccessBySession.clear();
  requestReplayBySession.clear();
  sessionStatements.clear();
  registrations.clear();
  waivedRegistrations.clear();
  abandonedSessions.clear();
}

function snapshotState(): PersistedCmi5State {
  return {
    abandonedSessions: Array.from(abandonedSessions.entries()).map(([sessionId, record]) => ({
      sessionId,
      abandonedAt: record.abandonedAt,
    })),
    importedPackages: Array.from(importedPackages.values()),
    launchAccessBySession: Array.from(launchAccessBySession.entries()).map(([sessionId, access]) => ({
      sessionId,
      access,
    })),
    launchesBySession: Array.from(launchesBySession.entries()).map(([sessionId, launch]) => ({ sessionId, launch })),
    registrations: Array.from(registrations.values()),
    requestReplayBySession: Array.from(requestReplayBySession.entries()).map(([sessionId, requestIds]) => ({
      sessionId,
      requestIds: Array.from(requestIds.values()),
    })),
    sessionStatements: Array.from(sessionStatements.entries()).map(([sessionId, statements]) => ({
      sessionId,
      statements,
    })),
    waivedRegistrations: Array.from(waivedRegistrations.entries()).map(([registrationId, record]) => ({
      registrationId,
      waivedAt: record.waivedAt,
    })),
  };
}

function applySnapshot(state: PersistedCmi5State): void {
  clearInMemoryState();

  for (const pkg of state.importedPackages) {
    importedPackages.set(pkg.packageId, pkg);
  }

  for (const { sessionId, launch } of state.launchesBySession) {
    launchesBySession.set(sessionId, launch);
  }

  for (const { sessionId, access } of state.launchAccessBySession) {
    launchAccessBySession.set(sessionId, access);
  }

  for (const { sessionId, requestIds } of state.requestReplayBySession) {
    requestReplayBySession.set(sessionId, new Set(requestIds));
  }

  for (const { sessionId, statements } of state.sessionStatements) {
    sessionStatements.set(sessionId, statements);
  }

  for (const registrationId of state.registrations) {
    registrations.add(registrationId);
  }

  for (const { registrationId, waivedAt } of state.waivedRegistrations) {
    waivedRegistrations.set(registrationId, { waivedAt });
  }

  for (const { sessionId, abandonedAt } of state.abandonedSessions) {
    abandonedSessions.set(sessionId, { abandonedAt });
  }
}

function writeStateToDisk(): void {
  const filePath = stateFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(snapshotState(), null, 2)}\n`, "utf8");
}

function loadStateFromDisk(): boolean {
  const filePath = stateFilePath();
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PersistedCmi5State;
    const isValidShape =
      parsed &&
      Array.isArray(parsed.importedPackages) &&
      Array.isArray(parsed.launchesBySession) &&
      Array.isArray(parsed.launchAccessBySession) &&
      Array.isArray(parsed.requestReplayBySession) &&
      Array.isArray(parsed.sessionStatements) &&
      Array.isArray(parsed.registrations) &&
      Array.isArray(parsed.waivedRegistrations) &&
      Array.isArray(parsed.abandonedSessions);

    if (!isValidShape) {
      return false;
    }

    applySnapshot(parsed);
    return true;
  } catch {
    return false;
  }
}

function deleteStateFile(): void {
  const filePath = stateFilePath();
  rmSync(filePath, { force: true });
}

const statementVerbOrder: SessionStatementVerb[] = [
  "initialized",
  "launched",
  "progressed",
  "completed",
  "passed",
  "failed",
  "terminated",
];

function hasVerb(statements: SessionStatementRecord[], verb: SessionStatementVerb): boolean {
  return statements.some((statement) => statement.verb === verb);
}

function moveOnSatisfied(moveOn: string, statements: SessionStatementRecord[]): boolean {
  const completed = hasVerb(statements, "completed");
  const passed = hasVerb(statements, "passed");

  switch (moveOn) {
    case "Passed":
      return passed;
    case "Completed":
      return completed;
    case "CompletedAndPassed":
      return completed && passed;
    case "CompletedOrPassed":
      return completed || passed;
    case "NotApplicable":
      return true;
    default:
      return false;
  }
}

function parseTtlSeconds(envVarName: string, fallbackSeconds: number): number {
  const rawValue = process.env[envVarName]?.trim();
  if (!rawValue) {
    return fallbackSeconds;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackSeconds;
  }

  return parsed;
}

function plusSecondsIso(baseDate: Date, ttlSeconds: number): string {
  return new Date(baseDate.getTime() + ttlSeconds * 1000).toISOString();
}

function makeAuthToken(sessionId: string, authTokenId: string): string {
  return `Basic ${Buffer.from(`launch:${sessionId}:${authTokenId}`).toString("base64")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function saveImportedPackage(pkg: ImportedPackage): void {
  importedPackages.set(pkg.packageId, pkg);
  writeStateToDisk();
}

export function getImportedPackage(packageId: string): ImportedPackage | null {
  return importedPackages.get(packageId) ?? null;
}

export function saveLaunch(record: LaunchRecord): void {
  const nowDate = new Date();
  const fetchTtlSeconds = parseTtlSeconds("CMI5_FETCH_TOKEN_TTL_SECONDS", 300);

  launchesBySession.set(record.sessionId, record);
  registrations.add(record.registrationId);
  sessionStatements.set(record.sessionId, []);
  requestReplayBySession.set(record.sessionId, new Set());
  launchAccessBySession.set(record.sessionId, {
    authExpiresAt: null,
    authIssuedAt: null,
    authToken: null,
    authTokenId: null,
    authUseCount: 0,
    fetchConsumedAt: null,
    fetchExpiresAt: plusSecondsIso(nowDate, fetchTtlSeconds),
    fetchToken: `fetch-${record.sessionId}`,
  });
  writeStateToDisk();
}

export function getLaunchBySession(sessionId: string): LaunchRecord | null {
  return launchesBySession.get(sessionId) ?? null;
}

export function getLaunchAccessBySession(sessionId: string): LaunchAccessRecord | null {
  return launchAccessBySession.get(sessionId) ?? null;
}

export function consumeLaunchFetchToken(
  sessionId: string,
  token: string,
  consumedAt: string,
):
  | {
      access: LaunchAccessRecord;
      ok: true;
    }
  | {
      code: string;
      message: string;
      ok: false;
      status: number;
    } {
  const access = launchAccessBySession.get(sessionId);
  if (!access || access.fetchToken !== token) {
    return {
      ok: false,
      status: 404,
      code: "launch_fetch_not_found",
      message: "token does not reference an active fetch session.",
    };
  }

  if (access.fetchConsumedAt !== null) {
    return {
      ok: false,
      status: 409,
      code: "launch_fetch_consumed",
      message: "token has already been exchanged.",
    };
  }

  const nowDate = new Date(consumedAt);
  const fetchExpiresAtMs = Date.parse(access.fetchExpiresAt);
  if (Number.isFinite(fetchExpiresAtMs) && nowDate.getTime() >= fetchExpiresAtMs) {
    return {
      ok: false,
      status: 403,
      code: "launch_fetch_expired",
      message: "token has expired.",
    };
  }

  const authTtlSeconds = parseTtlSeconds("CMI5_AUTH_TOKEN_TTL_SECONDS", 600);
  const authTokenId = newId("auth");

  const updatedAccess: LaunchAccessRecord = {
    ...access,
    authExpiresAt: plusSecondsIso(nowDate, authTtlSeconds),
    authIssuedAt: consumedAt,
    authToken: makeAuthToken(sessionId, authTokenId),
    authTokenId,
    authUseCount: 0,
    fetchConsumedAt: consumedAt,
  };
  launchAccessBySession.set(sessionId, updatedAccess);
  requestReplayBySession.set(sessionId, new Set());
  writeStateToDisk();

  return {
    ok: true,
    access: updatedAccess,
  };
}

export function getLaunchByAuthToken(authToken: string): LaunchRecord | null {
  for (const [sessionId, access] of launchAccessBySession.entries()) {
    if (access.authToken === authToken) {
      return launchesBySession.get(sessionId) ?? null;
    }
  }

  return null;
}

export function validateAuthToken(authToken: string, expectedSessionId?: string): AuthValidationResult {
  for (const [sessionId, access] of launchAccessBySession.entries()) {
    if (!access.authToken || access.authToken !== authToken) {
      continue;
    }

    if (expectedSessionId && expectedSessionId !== sessionId) {
      return {
        ok: false,
        status: 401,
        code: "invalid_auth_token",
        message: "authorization token is invalid for the requested session.",
      };
    }

    const authExpiresAtMs = access.authExpiresAt ? Date.parse(access.authExpiresAt) : NaN;
    if (Number.isFinite(authExpiresAtMs) && Date.now() >= authExpiresAtMs) {
      return {
        ok: false,
        status: 403,
        code: "auth_token_expired",
        message: "authorization token has expired.",
      };
    }

    if (getAbandonedSession(sessionId)) {
      return {
        ok: false,
        status: 403,
        code: "session_abandoned",
        message: "sessionId references an abandoned launch session.",
      };
    }

    const launch = launchesBySession.get(sessionId) ?? null;
    if (!launch) {
      return {
        ok: false,
        status: 404,
        code: "session_not_found",
        message: "sessionId does not reference an active launch session.",
      };
    }

    access.authUseCount += 1;
    launchAccessBySession.set(sessionId, access);
    writeStateToDisk();
    return {
      ok: true,
      launch,
      sessionId,
    };
  }

  return {
    ok: false,
    status: 401,
    code: "invalid_auth_token",
    message: "authorization token is invalid for the requested session.",
  };
}

export function recordRequestReplay(sessionId: string, requestId: string | null): boolean {
  if (!requestId || requestId.length === 0) {
    return true;
  }

  const replaySet = requestReplayBySession.get(sessionId) ?? new Set<string>();
  if (replaySet.has(requestId)) {
    return false;
  }

  replaySet.add(requestId);
  requestReplayBySession.set(sessionId, replaySet);
  writeStateToDisk();
  return true;
}

export function getSessionStatements(sessionId: string): SessionStatementRecord[] {
  return sessionStatements.get(sessionId) ?? [];
}

export function getSessionLifecycleStatus(sessionId: string): SessionLifecycleStatus | null {
  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return null;
  }

  const statements = getSessionStatements(sessionId);
  return {
    completed: hasVerb(statements, "completed"),
    failed: hasVerb(statements, "failed"),
    launched: hasVerb(statements, "launched"),
    moveOnSatisfied: moveOnSatisfied(launch.moveOn, statements),
    passed: hasVerb(statements, "passed"),
    progressed: hasVerb(statements, "progressed"),
    terminated: hasVerb(statements, "terminated"),
  };
}

export function appendSessionStatement(
  sessionId: string,
  registrationId: string,
  verb: SessionStatementVerb,
  statementId?: string,
  timestamp?: string,
):
  | {
      statement: SessionStatementRecord;
      lifecycle: SessionLifecycleStatus;
      ok: true;
    }
  | {
      code: string;
      message: string;
      ok: false;
      status: number;
    } {
  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return {
      ok: false,
      status: 404,
      code: "session_not_found",
      message: "sessionId does not reference an active launch session.",
    };
  }

  if (launch.registrationId !== registrationId) {
    return {
      ok: false,
      status: 409,
      code: "registration_mismatch",
      message: "registrationId does not match the active session registration.",
    };
  }

  if (getAbandonedSession(sessionId)) {
    return {
      ok: false,
      status: 409,
      code: "session_abandoned",
      message: "sessionId references an abandoned launch session.",
    };
  }

  if (!statementVerbOrder.includes(verb)) {
    return {
      ok: false,
      status: 400,
      code: "invalid_statement_verb",
      message: "verb is not a supported cmi5 lifecycle statement verb.",
    };
  }

  const statements = getSessionStatements(sessionId);
  const initialized = hasVerb(statements, "initialized");
  const launched = hasVerb(statements, "launched");
  const completed = hasVerb(statements, "completed");
  const passed = hasVerb(statements, "passed");
  const failed = hasVerb(statements, "failed");
  const terminated = hasVerb(statements, "terminated");

  if (terminated) {
    return {
      ok: false,
      status: 409,
      code: "session_terminated",
      message: "session has already terminated.",
    };
  }

  if (verb === "initialized" && statements.length > 0) {
    return {
      ok: false,
      status: 409,
      code: "statement_sequence_violation",
      message: "initialized must be the first statement.",
    };
  }

  if (verb === "launched" && (!initialized || launched)) {
    return {
      ok: false,
      status: 409,
      code: "statement_sequence_violation",
      message: "launched requires initialized and may only occur once.",
    };
  }

  if (verb === "progressed" && (!launched || completed)) {
    return {
      ok: false,
      status: 409,
      code: "statement_sequence_violation",
      message: "progressed requires launched and must precede completed.",
    };
  }

  if (verb === "completed" && (!launched || completed)) {
    return {
      ok: false,
      status: 409,
      code: "statement_sequence_violation",
      message: "completed requires launched and may only occur once.",
    };
  }

  if (verb === "passed") {
    if (!completed || passed || failed || launch.moveOn === "NotApplicable") {
      return {
        ok: false,
        status: 409,
        code: "statement_sequence_violation",
        message: "passed requires completed, no prior outcome, and a compatible moveOn.",
      };
    }
  }

  if (verb === "failed") {
    if (!completed || passed || failed || launch.moveOn !== "Completed") {
      return {
        ok: false,
        status: 409,
        code: "move_on_violation",
        message: "failed is only accepted for moveOn=Completed after completed.",
      };
    }
  }

  if (verb === "terminated" && (!launched || !moveOnSatisfied(launch.moveOn, statements))) {
    return {
      ok: false,
      status: 409,
      code: "move_on_not_satisfied",
      message: "terminated requires moveOn criteria to be satisfied.",
    };
  }

  const newStatement: SessionStatementRecord = {
    statementId: statementId && statementId.length > 0 ? statementId : newId("stmt"),
    verb,
    sessionId,
    registrationId,
    timestamp: timestamp && timestamp.length > 0 ? timestamp : nowIso(),
    sequence: statements.length + 1,
  };

  const nextStatements = [...statements, newStatement];
  sessionStatements.set(sessionId, nextStatements);
  writeStateToDisk();

  return {
    ok: true,
    statement: newStatement,
    lifecycle: {
      completed: hasVerb(nextStatements, "completed"),
      failed: hasVerb(nextStatements, "failed"),
      launched: hasVerb(nextStatements, "launched"),
      moveOnSatisfied: moveOnSatisfied(launch.moveOn, nextStatements),
      passed: hasVerb(nextStatements, "passed"),
      progressed: hasVerb(nextStatements, "progressed"),
      terminated: hasVerb(nextStatements, "terminated"),
    },
  };
}

export function hasRegistration(registrationId: string): boolean {
  return registrations.has(registrationId);
}

export function waiveRegistration(registrationId: string, waivedAt: string): void {
  waivedRegistrations.set(registrationId, { waivedAt });
  writeStateToDisk();
}

export function getWaivedRegistration(registrationId: string): WaivedRegistrationRecord | null {
  return waivedRegistrations.get(registrationId) ?? null;
}

export function abandonSession(sessionId: string, abandonedAt: string): void {
  abandonedSessions.set(sessionId, { abandonedAt });

  const access = launchAccessBySession.get(sessionId);
  if (!access) {
    return;
  }

  const revokedAccess: LaunchAccessRecord = {
    ...access,
    authExpiresAt: abandonedAt,
  };
  launchAccessBySession.set(sessionId, revokedAccess);
  writeStateToDisk();
}

export function getAbandonedSession(sessionId: string): AbandonedSessionRecord | null {
  return abandonedSessions.get(sessionId) ?? null;
}

export function reloadCmi5StateFromDisk(): { filePath: string; loaded: boolean } {
  clearInMemoryState();
  return {
    filePath: stateFilePath(),
    loaded: loadStateFromDisk(),
  };
}

export function getCmi5StateCounts(): {
  abandonedSessions: number;
  importedPackages: number;
  launchAccessRecords: number;
  launches: number;
  registrations: number;
  sessionStatements: number;
  waivedRegistrations: number;
} {
  return {
    abandonedSessions: abandonedSessions.size,
    importedPackages: importedPackages.size,
    launchAccessRecords: launchAccessBySession.size,
    launches: launchesBySession.size,
    registrations: registrations.size,
    sessionStatements: sessionStatements.size,
    waivedRegistrations: waivedRegistrations.size,
  };
}

export function resetCmi5State(): void {
  clearInMemoryState();
  deleteStateFile();
}

loadStateFromDisk();
