import { requireBearer } from "./auth";
import { abandonRoute } from "./routes/cmi5-abandon";
import { fetchRoute } from "./routes/cmi5-fetch";
import { launchCreateRoute } from "./routes/cmi5-launch-create";
import { launchDataRoute } from "./routes/cmi5-launch-data";
import { packageImportRoute } from "./routes/cmi5-package-import";
import { stateReloadRoute } from "./routes/cmi5-state-reload";
import { getStatementsRoute, postStatementRoute } from "./routes/cmi5-statements";
import { waiveRoute } from "./routes/cmi5-waive";
import { capabilitiesRoute } from "./routes/capabilities";
import { fixturesProvisionRoute } from "./routes/fixtures-provision";
import { healthRoute } from "./routes/health";
import { profileRoute } from "./routes/profile";

const port = Number(process.env.PORT ?? 4500);

Bun.serve({
  port,
  routes: {
    "/health": {
      GET: () => healthRoute(),
    },
    "/v1/capabilities": {
      GET: (request) => requireBearer(request) ?? capabilitiesRoute(),
    },
    "/v1/profile": {
      GET: (request) => requireBearer(request) ?? profileRoute(),
    },
    "/v1/fixtures/provision": {
      POST: async (request) => requireBearer(request) ?? (await fixturesProvisionRoute(request)),
    },
    "/v1/cmi5/packages/import": {
      POST: async (request) => requireBearer(request) ?? (await packageImportRoute(request)),
    },
    "/v1/cmi5/launches": {
      POST: async (request) => requireBearer(request) ?? (await launchCreateRoute(request)),
    },
    "/v1/cmi5/launch/fetch": {
      POST: async (request) => await fetchRoute(request),
    },
    "/v1/cmi5/launch-data": {
      GET: async (request) => await launchDataRoute(request),
    },
    "/v1/cmi5/xapi/statements": {
      GET: async (request) => await getStatementsRoute(request),
      POST: async (request) => await postStatementRoute(request),
    },
    "/v1/cmi5/registrations/waive": {
      POST: async (request) => requireBearer(request) ?? (await waiveRoute(request)),
    },
    "/v1/cmi5/sessions/abandon": {
      POST: async (request) => requireBearer(request) ?? (await abandonRoute(request)),
    },
    "/v1/cmi5/state/reload": {
      POST: async (request) => requireBearer(request) ?? (await stateReloadRoute(request)),
    },
  },
});

console.log("[cmi5-adapter-reference] listening on " + port);
