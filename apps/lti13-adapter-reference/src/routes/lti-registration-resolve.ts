export function registrationResolveRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "lti.registration.resolve" }, { status: 501 });
}
