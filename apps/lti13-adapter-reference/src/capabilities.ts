export const capabilities = {
  contractVersion: "1.0.0",
  adapterName: "lti13-adapter-reference",
  adapterVersion: "0.1.0",
  profiles: ["lti13-tool-v1"],
  operations: [
    "lti.registration.resolve",
    "lti.login.initiation",
    "lti.launch.create",
    "lti.deep-link.create",
    "lti.ags.line-items",
    "lti.ags.scores",
    "lti.nrps.memberships",
  ],
};
