import {
  getAbandonedSession,
  getImportedPackage,
  getLaunchAccessBySession,
  getWaivedRegistration,
  newId,
  nowIso,
  saveLaunch,
} from "./cmi5-state";
import { jsonError, readNonEmptyString, readObjectBody } from "./route-utils";

const defaultLaunchBaseUrl = "https://example.invalid/cmi5/launch";
const defaultLrsEndpoint = "https://example.invalid/xapi";
const allowedLaunchModes = new Set(["Normal", "Browse", "Review"]);
const allowedMoveOnModes = new Set(["Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed", "NotApplicable"]);

function readNumber(body: Record<string, unknown>, key: string): number | null {
  const value = body[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readOptionalMode(
  body: Record<string, unknown>,
  key: string,
  allowedValues: Set<string>,
): { value: string | null; invalid: boolean } {
  const value = body[key];
  if (typeof value === "undefined") {
    return { value: null, invalid: false };
  }
  if (typeof value !== "string") {
    return { value: null, invalid: true };
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0 || !allowedValues.has(trimmedValue)) {
    return { value: null, invalid: true };
  }

  return { value: trimmedValue, invalid: false };
}

export async function launchCreateRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const packageId = readNonEmptyString(body, "packageId");
  if (!packageId) {
    return jsonError(400, "missing_package_id", "packageId is required.");
  }

  if (!getImportedPackage(packageId)) {
    return jsonError(404, "package_not_found", "packageId has not been imported.");
  }

  const launchMode = readOptionalMode(body, "launchMode", allowedLaunchModes);
  if (launchMode.invalid) {
    return jsonError(400, "invalid_launch_mode", "launchMode must be one of Normal, Browse, or Review.");
  }

  const moveOn = readOptionalMode(body, "moveOn", allowedMoveOnModes);
  if (moveOn.invalid) {
    return jsonError(
      400,
      "invalid_move_on",
      "moveOn must be one of Passed, Completed, CompletedAndPassed, CompletedOrPassed, or NotApplicable.",
    );
  }

  const launchId = readNonEmptyString(body, "launchId") ?? newId("launch");
  const registrationId = readNonEmptyString(body, "registrationId") ?? newId("registration");
  const sessionId = readNonEmptyString(body, "sessionId") ?? newId("session");
  if (getAbandonedSession(sessionId)) {
    return jsonError(409, "session_abandoned", "sessionId references an abandoned launch session.");
  }
  const hasLearnerId = Object.hasOwn(body, "learnerId");
  const learnerId = readNonEmptyString(body, "learnerId") ?? "learner@example.test";
  if (hasLearnerId && !readNonEmptyString(body, "learnerId")) {
    return jsonError(400, "invalid_learner_id", "learnerId must be a non-empty string when provided.");
  }
  const launchModeValue = launchMode.value ?? "Normal";
  const moveOnValue = moveOn.value ?? "CompletedAndPassed";
  const masteryScore = readNumber(body, "masteryScore") ?? 0.9;
  if (masteryScore < 0 || masteryScore > 1) {
    return jsonError(400, "invalid_mastery_score", "masteryScore must be between 0 and 1.");
  }
  const hasLaunchParameters = Object.hasOwn(body, "launchParameters");
  const launchParameters = readNonEmptyString(body, "launchParameters") ?? "paramA=1&paramB=2";
  if (hasLaunchParameters && !readNonEmptyString(body, "launchParameters")) {
    return jsonError(400, "invalid_launch_parameters", "launchParameters must be a non-empty string when provided.");
  }
  const hasActivityId = Object.hasOwn(body, "activityId");
  const activityId =
    readNonEmptyString(body, "activityId") ?? "https://w3id.org/xapi/cmi5/catapult/lts/au/001-essentials";
  if (hasActivityId && !readNonEmptyString(body, "activityId")) {
    return jsonError(400, "invalid_activity_id", "activityId must be a non-empty string when provided.");
  }
  const hasEntitlementKey = Object.hasOwn(body, "entitlementKey");
  const entitlementKey = readNonEmptyString(body, "entitlementKey") ?? `entitlement-${learnerId}`;
  if (hasEntitlementKey && !readNonEmptyString(body, "entitlementKey")) {
    return jsonError(400, "invalid_entitlement_key", "entitlementKey must be a non-empty string when provided.");
  }
  const launchBaseUrl = process.env["CMI5_LAUNCH_BASE_URL"]?.trim() || defaultLaunchBaseUrl;
  const lrsEndpoint = process.env["CMI5_LRS_ENDPOINT"]?.trim() || defaultLrsEndpoint;
  const requestOrigin = new URL(request.url).origin;
  const fetchToken = `fetch-${sessionId}`;
  const fetchUrl = `${requestOrigin}/v1/cmi5/launch/fetch?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(fetchToken)}`;
  const encodedLaunchParameters = encodeURIComponent(launchParameters);
  const launchUrl = `${launchBaseUrl}/${launchId}?fetch=${encodeURIComponent(fetchUrl)}&registration=${encodeURIComponent(registrationId)}&actor=${encodeURIComponent(learnerId)}&activityId=${encodeURIComponent(activityId)}&endpoint=${encodeURIComponent(lrsEndpoint)}&launchMode=${encodeURIComponent(launchModeValue)}&moveOn=${encodeURIComponent(moveOnValue)}&masteryScore=${encodeURIComponent(String(masteryScore))}&launchParameters=${encodedLaunchParameters}`;
  const createdAt = nowIso();
  const waivedRegistration = getWaivedRegistration(registrationId);

  saveLaunch({
    launchId,
    packageId,
    registrationId,
    sessionId,
    learnerId,
    launchUrl,
    launchMode: launchModeValue,
    moveOn: moveOnValue,
    masteryScore,
    launchParameters,
    activityId,
    entitlementKey,
    createdAt,
  });

  const launchAccess = getLaunchAccessBySession(sessionId);

  return Response.json({
    status: "ok",
    operation: "cmi5.launch.create",
    launchId,
    packageId,
    registrationId,
    sessionId,
    learnerId,
    actor: {
      account: {
        homePage: "https://w3id.org/xapi/cmi5/catapult/lts",
        name: learnerId,
      },
    },
    endpoint: lrsEndpoint,
    fetch: fetchUrl,
    fetchExpiresAt: launchAccess?.fetchExpiresAt ?? null,
    launchMode: launchModeValue,
    moveOn: moveOnValue,
    masteryScore,
    launchParameters,
    activityId,
    entitlementKey,
    waivedRegistration: waivedRegistration !== null,
    waivedAt: waivedRegistration?.waivedAt ?? null,
    launchUrl,
    contextTemplate: {
      contextActivities: {
        grouping: [{ id: activityId }],
      },
      extensions: {
        "https://w3id.org/xapi/cmi5/context/extensions/sessionid": sessionId,
        "https://w3id.org/xapi/cmi5/context/extensions/launchmode": launchModeValue,
        "https://w3id.org/xapi/cmi5/context/extensions/moveon": moveOnValue,
        "https://w3id.org/xapi/cmi5/context/extensions/launchparameters": launchParameters,
        "https://w3id.org/xapi/cmi5/context/extensions/masteryscore": masteryScore,
      },
    },
    createdAt,
  });
}
