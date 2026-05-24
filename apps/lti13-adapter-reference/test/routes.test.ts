import { expect, test } from "bun:test";
import {
  AdapterCapabilitySchema,
  AdapterProfileSchema,
  LtiAgsV2_0,
  LtiDeepLinkingV2_0,
  LtiNrpsV2_0,
  LtiV1_3,
} from "@conform-ed/contracts";
import { agsLineItemsRoute } from "../src/routes/lti-ags-line-items";
import { agsScoresRoute } from "../src/routes/lti-ags-scores";
import { deepLinkRoute } from "../src/routes/lti-deep-link";
import { launchCreateRoute } from "../src/routes/lti-launch-create";
import { loginInitiationRoute } from "../src/routes/lti-login-initiation";
import { nrpsMembershipsRoute } from "../src/routes/lti-nrps-memberships";
import { registrationResolveRoute } from "../src/routes/lti-registration-resolve";
import { capabilitiesRoute } from "../src/routes/capabilities";
import { profileRoute } from "../src/routes/profile";

test("capabilities route returns contract-valid payload", async () => {
  const response = capabilitiesRoute();
  expect(response.status).toBe(200);

  const payload = await response.json();
  const parsed = AdapterCapabilitySchema.safeParse(payload);
  expect(parsed.success).toBe(true);
});

test("profile route returns contract-valid payload", async () => {
  const response = profileRoute();
  expect(response.status).toBe(200);

  const payload = await response.json();
  const parsed = AdapterProfileSchema.safeParse(payload);
  expect(parsed.success).toBe(true);
});

test("operation routes return deterministic success payloads", async () => {
  const registrationResponse = (await registrationResolveRoute().json()) as { operation: string };
  expect(registrationResponse.operation).toBe("lti.registration.resolve");

  const loginResponse = (await loginInitiationRoute().json()) as { operation: string };
  expect(loginResponse.operation).toBe("lti.login.initiation");

  const launchResponse = (await launchCreateRoute().json()) as { operation: string; launch: unknown };
  expect(launchResponse.operation).toBe("lti.launch.create");
  expect(LtiV1_3.CoreLaunchRequestSchema.safeParse(launchResponse.launch).success).toBe(true);

  const deepLinkResponse = (await deepLinkRoute().json()) as { operation: string; deepLink: unknown };
  expect(deepLinkResponse.operation).toBe("lti.deep-link.create");
  expect(LtiDeepLinkingV2_0.DeepLinkingResponseSchema.safeParse(deepLinkResponse.deepLink).success).toBe(true);

  const lineItemsResponse = (await agsLineItemsRoute().json()) as { operation: string; lineItem: unknown };
  expect(lineItemsResponse.operation).toBe("lti.ags.line-items");
  expect(LtiAgsV2_0.LineItemSchema.safeParse(lineItemsResponse.lineItem).success).toBe(true);

  const scoresResponse = (await agsScoresRoute().json()) as { operation: string; score: unknown };
  expect(scoresResponse.operation).toBe("lti.ags.scores");
  expect(LtiAgsV2_0.ScoreSchema.safeParse(scoresResponse.score).success).toBe(true);

  const nrpsResponse = (await nrpsMembershipsRoute().json()) as { operation: string; members: unknown };
  expect(nrpsResponse.operation).toBe("lti.nrps.memberships");
  expect(LtiNrpsV2_0.MembershipContainerSchema.safeParse(nrpsResponse.members).success).toBe(true);
});
