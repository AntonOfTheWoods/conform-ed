export function loginInitiationRoute(): Response {
  return Response.json({
    operation: "lti.login.initiation",
    login: {
      loginUrl: "https://example.platform/oidc/auth",
      state: "state-demo-123",
      nonce: "nonce-demo-123",
    },
  });
}
