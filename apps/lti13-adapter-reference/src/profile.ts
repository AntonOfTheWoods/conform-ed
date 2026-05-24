export const profile = {
  contractVersion: "1.0.0",
  profileVersion: "1.0.0",
  suite: "lti13",
  adapter: {
    name: "lti13-adapter-reference",
    version: "0.1.0",
    transport: "http-json",
  },
  interoperability: {
    statementRetrieval: "adapter-api",
  },
  operations: [
    {
      name: "lti.registration.resolve",
      path: "/v1/lti/registrations/resolve",
      method: "POST",
    },
    {
      name: "lti.login.initiation",
      path: "/v1/lti/login-initiation",
      method: "POST",
    },
    {
      name: "lti.launch.create",
      path: "/v1/lti/launches",
      method: "POST",
    },
    {
      name: "lti.deep-link.create",
      path: "/v1/lti/deep-links",
      method: "POST",
    },
    {
      name: "lti.ags.line-items",
      path: "/v1/lti/ags/line-items",
      method: "POST",
    },
    {
      name: "lti.ags.scores",
      path: "/v1/lti/ags/scores",
      method: "POST",
    },
    {
      name: "lti.nrps.memberships",
      path: "/v1/lti/nrps/memberships",
      method: "GET",
    },
  ],
  artifacts: {
    requirementTraceRequired: true,
  },
} as const;
