export function packageImportRoute(): Response {
  return Response.json({ status: "not_implemented", operation: "cmi5.package.import" }, { status: 501 });
}
