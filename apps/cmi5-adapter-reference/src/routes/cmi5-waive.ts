export function waiveRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "cmi5.registration.waive" }, { status: 501 });
}
