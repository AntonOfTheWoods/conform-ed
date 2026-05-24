import { LtiNrpsV2_0 } from "@conform-ed/contracts";

export function nrpsMembershipsRoute(): Response {
  return Response.json({
    operation: "lti.nrps.memberships",
    members: LtiNrpsV2_0.MembershipContainerSchema.parse({
      id: "https://platform.example/context/2923/memberships",
      context: {
        id: "2923-abc",
        label: "CPS 435",
        title: "CPS 435 Learning Analytics",
      },
      members: [
        {
          status: "Active",
          name: "Jane Q. Public",
          givenName: "Jane",
          familyName: "Public",
          email: "jane@example.com",
          userId: "student-123",
          roles: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
        },
      ],
    }),
  });
}
