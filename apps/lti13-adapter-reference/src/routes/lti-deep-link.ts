import { LtiDeepLinkingV2_0 } from "@conform-ed/contracts";

export function deepLinkRoute(): Response {
  return Response.json({
    operation: "lti.deep-link.create",
    deepLink: LtiDeepLinkingV2_0.DeepLinkingResponseSchema.parse({
      messageType: "LtiDeepLinkingResponse",
      version: "1.3.0",
      contentItems: [
        {
          type: "ltiResourceLink",
          title: "Example Link",
          url: "https://tool.example/content/alpha",
        },
      ],
    }),
  });
}
