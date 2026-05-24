export const capabilities = {
  contractVersion: "1.0.0",
  adapterName: "cmi5-adapter-reference",
  adapterVersion: "0.1.0",
  profiles: ["cmi5-lms-v1"],
  operations: [
    "fixtures.provision",
    "cmi5.package.import",
    "cmi5.launch.create",
    "cmi5.registration.waive",
    "cmi5.session.abandon",
  ],
};
