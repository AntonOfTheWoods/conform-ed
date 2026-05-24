export function nrpsMembershipsRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "lti.nrps.memberships" }, { status: 501 });
}
