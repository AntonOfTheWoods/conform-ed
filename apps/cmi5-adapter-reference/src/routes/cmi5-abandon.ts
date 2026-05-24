import { abandonSession, getAbandonedSession, getLaunchBySession, nowIso } from "./cmi5-state";
import { jsonError, readNonEmptyString, readObjectBody } from "./route-utils";

export async function abandonRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const sessionId = readNonEmptyString(body, "sessionId");
  if (!sessionId) {
    return jsonError(400, "missing_session_id", "sessionId is required.");
  }

  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return jsonError(404, "session_not_found", "sessionId does not reference an active launch session.");
  }

  const existingAbandon = getAbandonedSession(sessionId);
  if (existingAbandon) {
    return jsonError(409, "session_already_abandoned", "sessionId has already been abandoned.");
  }

  const abandonedAt = nowIso();

  abandonSession(sessionId, abandonedAt);

  return Response.json({
    status: "ok",
    operation: "cmi5.session.abandon",
    sessionId,
    launchId: launch.launchId,
    abandoned: true,
    abandonedAt,
  });
}
