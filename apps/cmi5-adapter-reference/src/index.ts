import { requireBearer } from "./auth";
import { abandonRoute } from "./routes/cmi5-abandon";
import { launchCreateRoute } from "./routes/cmi5-launch-create";
import { packageImportRoute } from "./routes/cmi5-package-import";
import { waiveRoute } from "./routes/cmi5-waive";
import { capabilitiesRoute } from "./routes/capabilities";
import { fixturesProvisionRoute } from "./routes/fixtures-provision";
import { healthRoute } from "./routes/health";

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
    "/v1/fixtures/provision": {
      POST: (request) => requireBearer(request) ?? fixturesProvisionRoute(),
    },
    "/v1/cmi5/packages/import": {
      POST: (request) => requireBearer(request) ?? packageImportRoute(),
    },
    "/v1/cmi5/launches": {
      POST: (request) => requireBearer(request) ?? launchCreateRoute(),
    },
    "/v1/cmi5/registrations/waive": {
      POST: (request) => requireBearer(request) ?? waiveRoute(),
    },
    "/v1/cmi5/sessions/abandon": {
      POST: (request) => requireBearer(request) ?? abandonRoute(),
    },
  },
});

console.log("[cmi5-adapter-reference] listening on " + port);
