import { getLaunchBySession, getWaivedRegistration, recordRequestReplay, validateAuthToken } from "./cmi5-state";
import { jsonError } from "./route-utils";

export async function launchDataRoute(request: Request): Promise<Response> {
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

  const requestId = request.headers.get("x-cmi5-request-id")?.trim() ?? "";
  if (!recordRequestReplay(sessionId, requestId)) {
    return jsonError(409, "replay_detected", "x-cmi5-request-id has already been used for this launch session.");
  }

  const waivedRegistration = getWaivedRegistration(launch.registrationId);

  return Response.json({
    status: "ok",
    operation: "cmi5.launch.data",
    launchId: launch.launchId,
    launchSessionId: launch.sessionId,
    registration: launch.registrationId,
    launchMode: launch.launchMode,
    moveOn: launch.moveOn,
    masteryScore: launch.masteryScore,
    launchParameters: launch.launchParameters,
    activityId: launch.activityId,
    entitlementKey: launch.entitlementKey,
    waivedRegistration: waivedRegistration !== null,
    waivedAt: waivedRegistration?.waivedAt ?? null,
    contextTemplate: {
      registration: launch.registrationId,
      contextActivities: {
        grouping: [{ id: launch.activityId }],
      },
      extensions: {
        "https://w3id.org/xapi/cmi5/context/extensions/sessionid": launch.sessionId,
        "https://w3id.org/xapi/cmi5/context/extensions/launchmode": launch.launchMode,
        "https://w3id.org/xapi/cmi5/context/extensions/moveon": launch.moveOn,
        "https://w3id.org/xapi/cmi5/context/extensions/launchparameters": launch.launchParameters,
        "https://w3id.org/xapi/cmi5/context/extensions/masteryscore": launch.masteryScore,
      },
    },
  });
}
