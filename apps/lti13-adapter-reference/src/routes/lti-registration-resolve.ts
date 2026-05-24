export function registrationResolveRoute(): Response {
  return Response.json({
    operation: "lti.registration.resolve",
    registration: {
      registrationId: "reg-demo-001",
      issuer: "https://example.platform",
      clientId: "client-123",
      deploymentId: "deployment-123",
    },
  });
}
