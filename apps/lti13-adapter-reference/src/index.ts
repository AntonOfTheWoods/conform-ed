import { requireBearer } from "./auth";
import { agsLineItemsRoute } from "./routes/lti-ags-line-items";
import { agsScoresRoute } from "./routes/lti-ags-scores";
import { deepLinkRoute } from "./routes/lti-deep-link";
import { launchCreateRoute } from "./routes/lti-launch-create";
import { loginInitiationRoute } from "./routes/lti-login-initiation";
import { nrpsMembershipsRoute } from "./routes/lti-nrps-memberships";
import { registrationResolveRoute } from "./routes/lti-registration-resolve";
import { capabilitiesRoute } from "./routes/capabilities";
import { healthRoute } from "./routes/health";
import { profileRoute } from "./routes/profile";

const port = Number(process.env["PORT"] ?? 4600);

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
    "/v1/lti/registrations/resolve": {
      POST: (request) => requireBearer(request) ?? registrationResolveRoute(),
    },
    "/v1/lti/login-initiation": {
      POST: (request) => requireBearer(request) ?? loginInitiationRoute(),
    },
    "/v1/lti/launches": {
      POST: (request) => requireBearer(request) ?? launchCreateRoute(),
    },
    "/v1/lti/deep-links": {
      POST: (request) => requireBearer(request) ?? deepLinkRoute(),
    },
    "/v1/lti/ags/line-items": {
      POST: (request) => requireBearer(request) ?? agsLineItemsRoute(),
    },
    "/v1/lti/ags/scores": {
      POST: (request) => requireBearer(request) ?? agsScoresRoute(),
    },
    "/v1/lti/nrps/memberships": {
      GET: (request) => requireBearer(request) ?? nrpsMembershipsRoute(),
    },
  },
});

console.log("[lti13-adapter-reference] listening on " + port);
