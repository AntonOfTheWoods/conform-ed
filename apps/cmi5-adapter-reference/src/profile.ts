export const profile = {
  contractVersion: "1.0.0",
  profileVersion: "1.0.0",
  suite: "cmi5",
  adapter: {
    name: "cmi5-adapter-reference",
    version: "0.1.0",
    transport: "http-json",
  },
  interoperability: {
    statementRetrieval: "adapter-api",
    packageUpload: "inline-base64",
  },
  operations: [
    {
      name: "fixtures.provision",
      path: "/v1/fixtures/provision",
      method: "POST",
    },
    {
      name: "cmi5.package.import",
      path: "/v1/cmi5/packages/import",
      method: "POST",
    },
    {
      name: "cmi5.launch.create",
      path: "/v1/cmi5/launches",
      method: "POST",
    },
    {
      name: "cmi5.launch.fetch",
      path: "/v1/cmi5/launch/fetch",
      method: "POST",
    },
    {
      name: "cmi5.launch.data",
      path: "/v1/cmi5/launch-data",
      method: "GET",
    },
    {
      name: "cmi5.au.statement.post",
      path: "/v1/cmi5/xapi/statements",
      method: "POST",
    },
    {
      name: "cmi5.au.statement.get",
      path: "/v1/cmi5/xapi/statements",
      method: "GET",
    },
    {
      name: "cmi5.registration.waive",
      path: "/v1/cmi5/registrations/waive",
      method: "POST",
    },
    {
      name: "cmi5.session.abandon",
      path: "/v1/cmi5/sessions/abandon",
      method: "POST",
    },
    {
      name: "cmi5.state.reload",
      path: "/v1/cmi5/state/reload",
      method: "POST",
    },
  ],
  artifacts: {
    requirementTraceRequired: true,
  },
} as const;
