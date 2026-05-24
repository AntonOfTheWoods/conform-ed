import { getCmi5StateCounts, reloadCmi5StateFromDisk } from "./cmi5-state";
import { jsonError, readObjectBody } from "./route-utils";

export async function stateReloadRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const reload = reloadCmi5StateFromDisk();

  return Response.json({
    status: "ok",
    operation: "cmi5.state.reload",
    filePath: reload.filePath,
    loaded: reload.loaded,
    stateCounts: getCmi5StateCounts(),
  });
}
