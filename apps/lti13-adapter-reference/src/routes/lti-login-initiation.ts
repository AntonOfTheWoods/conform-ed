export function loginInitiationRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "lti.login.initiation" }, { status: 501 });
}
