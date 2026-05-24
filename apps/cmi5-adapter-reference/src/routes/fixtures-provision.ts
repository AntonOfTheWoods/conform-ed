import { newId, nowIso } from "./cmi5-state";
import { readObjectBody, readNonEmptyString } from "./route-utils";

export async function fixturesProvisionRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  const fixtureId = body ? readNonEmptyString(body, "fixtureId") : null;

  return Response.json({
    status: "ok",
    operation: "fixtures.provision",
    fixtureId: fixtureId ?? newId("fixture"),
    provisionedAt: nowIso(),
  });
}
