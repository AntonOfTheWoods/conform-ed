import { getWaivedRegistration, hasRegistration, nowIso, waiveRegistration } from "./cmi5-state";
import { jsonError, readNonEmptyString, readObjectBody } from "./route-utils";

export async function waiveRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const registrationId = readNonEmptyString(body, "registrationId");
  if (!registrationId) {
    return jsonError(400, "missing_registration_id", "registrationId is required.");
  }

  if (!hasRegistration(registrationId)) {
    return jsonError(404, "registration_not_found", "registrationId does not reference an active registration.");
  }

  const existingWaive = getWaivedRegistration(registrationId);
  const waivedAt = existingWaive?.waivedAt ?? nowIso();

  if (!existingWaive) {
    waiveRegistration(registrationId, waivedAt);
  }

  return Response.json({
    status: "ok",
    operation: "cmi5.registration.waive",
    registrationId,
    waived: true,
    alreadyWaived: existingWaive !== null,
    waivedAt,
  });
}
