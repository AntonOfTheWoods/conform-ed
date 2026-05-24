import {
  appendSessionStatement,
  getLaunchBySession,
  recordRequestReplay,
  getSessionLifecycleStatus,
  getSessionStatements,
  type SessionStatementVerb,
  validateAuthToken,
} from "./cmi5-state";
import { jsonError, readNonEmptyString, readObjectBody } from "./route-utils";

const allowedVerbs = new Set(["initialized", "launched", "progressed", "completed", "passed", "failed", "terminated"]);

function asStatementVerb(value: string): SessionStatementVerb | null {
  if (!allowedVerbs.has(value)) {
    return null;
  }

  return value as SessionStatementVerb;
}

export async function postStatementRoute(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (authorization.length === 0) {
    return jsonError(401, "missing_auth_token", "authorization header is required.");
  }

  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const sessionId = readNonEmptyString(body, "sessionId");
  if (!sessionId) {
    return jsonError(400, "missing_session_id", "sessionId is required.");
  }

  const registrationId = readNonEmptyString(body, "registrationId");
  if (!registrationId) {
    return jsonError(400, "missing_registration_id", "registrationId is required.");
  }

  const verb = readNonEmptyString(body, "verb");
  const statementVerb = verb ? asStatementVerb(verb) : null;
  if (!statementVerb) {
    return jsonError(400, "invalid_statement_verb", "verb must be a valid cmi5 lifecycle statement verb.");
  }

  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return jsonError(404, "session_not_found", "sessionId does not reference an active launch session.");
  }

  const authValidation = validateAuthToken(authorization, sessionId);
  if (!authValidation.ok) {
    return jsonError(authValidation.status, authValidation.code, authValidation.message);
  }

  const requestId = request.headers.get("x-cmi5-request-id")?.trim() ?? "";
  if (!recordRequestReplay(sessionId, requestId)) {
    return jsonError(409, "replay_detected", "x-cmi5-request-id has already been used for this launch session.");
  }

  const statementId = readNonEmptyString(body, "statementId") ?? undefined;
  const timestamp = readNonEmptyString(body, "timestamp") ?? undefined;
  const recordResult = appendSessionStatement(sessionId, registrationId, statementVerb, statementId, timestamp);

  if (!recordResult.ok) {
    return jsonError(recordResult.status, recordResult.code, recordResult.message);
  }

  return Response.json({
    status: "ok",
    operation: "cmi5.au.statement.post",
    sessionId,
    registrationId,
    statementId: recordResult.statement.statementId,
    verb: recordResult.statement.verb,
    timestamp: recordResult.statement.timestamp,
    sequence: recordResult.statement.sequence,
    lifecycle: recordResult.lifecycle,
  });
}

export async function getStatementsRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  if (sessionId.length === 0) {
    return jsonError(400, "missing_session_id", "sessionId query parameter is required.");
  }

  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return jsonError(404, "session_not_found", "sessionId does not reference an active launch session.");
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (authorization.length === 0) {
    return jsonError(401, "missing_auth_token", "authorization header is required.");
  }

  const authValidation = validateAuthToken(authorization, sessionId);
  if (!authValidation.ok) {
    return jsonError(authValidation.status, authValidation.code, authValidation.message);
  }

  const lifecycle = getSessionLifecycleStatus(sessionId);
  if (!lifecycle) {
    return jsonError(404, "session_not_found", "sessionId does not reference an active launch session.");
  }

  return Response.json({
    status: "ok",
    operation: "cmi5.au.statement.get",
    sessionId,
    registrationId: launch.registrationId,
    moveOn: launch.moveOn,
    statements: getSessionStatements(sessionId),
    lifecycle,
  });
}
