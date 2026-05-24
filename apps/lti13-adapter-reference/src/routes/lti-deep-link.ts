export function deepLinkRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "lti.deep-link.create" }, { status: 501 });
}
