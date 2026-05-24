export function launchCreateRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "lti.launch.create" }, { status: 501 });
}
