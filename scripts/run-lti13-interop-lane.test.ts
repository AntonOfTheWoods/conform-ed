import { afterEach, expect, test } from "bun:test";
import { parseArgs, runInteropChecks } from "./run-lti13-interop-lane";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("parseArgs rejects oss-platform profile without OpenID configuration URL", () => {
  expect(() => parseArgs(["--interop-profile", "oss-platform"])).toThrow(
    "--platform-openid-configuration-url is required for --interop-profile oss-platform.",
  );
});

test("parseArgs rejects oss-tool profile without login and JWKS URLs", () => {
  expect(() =>
    parseArgs(["--interop-profile", "oss-tool", "--tool-login-initiation-url", "https://tool.example/login"]),
  ).toThrow("--tool-jwks-url is required for --interop-profile oss-tool.");
});

test("runInteropChecks returns failed role compatibility check for oss-platform with platform role", async () => {
  const args = parseArgs([
    "--interop-profile",
    "oss-platform",
    "--role",
    "platform",
    "--platform-openid-configuration-url",
    "https://platform.example/.well-known/openid-configuration",
  ]);

  const checks = await runInteropChecks(args);
  expect(checks.some((check) => check.id === "profile.role.compatibility" && check.status === "failed")).toBe(true);
});

test("runInteropChecks reports issuer mismatch failure for oss-platform profile", async () => {
  globalThis.fetch = (async (input: Request | URL | string) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/.well-known/openid-configuration")) {
      return Response.json({
        issuer: "https://actual.example",
        jwks_uri: "https://platform.example/jwks",
        authorization_endpoint: "https://platform.example/auth",
      });
    }

    if (url.endsWith("/jwks")) {
      return Response.json({ keys: [{ kty: "RSA", kid: "1", e: "AQAB", n: "abc" }] });
    }

    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  const args = parseArgs([
    "--interop-profile",
    "oss-platform",
    "--role",
    "tool",
    "--platform-openid-configuration-url",
    "https://platform.example/.well-known/openid-configuration",
    "--platform-issuer",
    "https://expected.example",
  ]);

  const checks = await runInteropChecks(args);
  expect(checks.some((check) => check.id === "oss-platform.issuer.match" && check.status === "failed")).toBe(true);
});
