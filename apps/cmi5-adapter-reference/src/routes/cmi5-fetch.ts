import { consumeLaunchFetchToken, getLaunchAccessBySession, getLaunchBySession, nowIso } from "./cmi5-state";
import { jsonError } from "./route-utils";

export async function fetchRoute(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (sessionId.length === 0 || token.length === 0) {
    return jsonError(400, "missing_fetch_parameters", "sessionId and token query parameters are required.");
  }

  const launch = getLaunchBySession(sessionId);
  if (!launch) {
    return jsonError(404, "session_not_found", "sessionId does not reference an active launch session.");
  }

  const launchAccess = getLaunchAccessBySession(sessionId);
  if (!launchAccess || launchAccess.fetchToken !== token) {
    return jsonError(404, "launch_fetch_not_found", "token does not reference an active fetch session.");
  }

  const consumedAt = nowIso();
  const consumedResult = consumeLaunchFetchToken(sessionId, token, consumedAt);
  if (!consumedResult.ok) {
    return jsonError(consumedResult.status, consumedResult.code, consumedResult.message);
  }
  const consumedAccess = consumedResult.access;

  const launchDataUrl = `${url.origin}/v1/cmi5/launch-data?sessionId=${encodeURIComponent(launch.sessionId)}`;

  return Response.json({
    status: "ok",
    operation: "cmi5.launch.fetch",
    sessionId: launch.sessionId,
    launchDataUrl,
    consumedAt,
    authExpiresAt: consumedAccess.authExpiresAt,
    "auth-token": consumedAccess.authToken,
  });
}
