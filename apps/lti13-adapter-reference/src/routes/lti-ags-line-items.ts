import { LtiAgsV2_0 } from "@conform-ed/contracts";

export function agsLineItemsRoute(): Response {
  return Response.json({
    operation: "lti.ags.line-items",
    lineItem: LtiAgsV2_0.LineItemSchema.parse({
      id: "https://platform.example/lineitems/1",
      label: "Example Grade",
      scoreMaximum: 100,
      resourceLinkId: "resource-123",
      gradesReleased: true,
    }),
  });
}
