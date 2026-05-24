export function fixturesProvisionRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "fixtures.provision" }, { status: 501 });
}
