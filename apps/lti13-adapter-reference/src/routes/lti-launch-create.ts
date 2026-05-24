import { LtiV1_3 } from "@conform-ed/contracts";

export function launchCreateRoute(): Response {
  return Response.json({
    operation: "lti.launch.create",
    launch: LtiV1_3.CoreLaunchRequestSchema.parse({
      messageType: "LtiResourceLinkRequest",
      version: "1.3.0",
      deploymentId: "deployment-123",
      targetLinkUri: "https://tool.example/launch",
      resourceLink: {
        id: "resource-123",
        title: "Example Resource",
      },
      subject: "student-123",
      context: {
        id: "course-123",
        label: "CPS 435",
        title: "CPS 435 Learning Analytics",
        type: ["CourseSection"],
      },
      roles: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
      lis: {
        courseOfferingSourcedId: "course-123",
      },
      launchPresentation: {
        documentTarget: "iframe",
        locale: "en-US",
        returnUrl: "https://platform.example/launch/return",
      },
    }),
  });
}
