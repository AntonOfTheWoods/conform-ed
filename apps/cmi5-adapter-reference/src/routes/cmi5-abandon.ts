export function abandonRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "cmi5.session.abandon" }, { status: 501 });
}
