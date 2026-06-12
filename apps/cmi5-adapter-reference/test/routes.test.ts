import { expect, test } from "bun:test";

import { AdapterCapabilitySchema, AdapterProfileSchema } from "@conform-ed/contracts";

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
