export function healthRoute(): Response {
  return Response.json({ status: "ok" });
}
