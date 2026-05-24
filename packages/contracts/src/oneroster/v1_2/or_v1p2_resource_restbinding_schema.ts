import { z } from "zod";

import { ResourceSetSchema, SingleResourceSchema } from "./or_v1p2_resource_service_schema";
import { ImsxStatusInfoSchema } from "./shared";

const EmptyPayloadSchema = z.undefined();

function resourceGetOperation(path: string, successResponsePayload: z.ZodTypeAny) {
  return {
    method: "GET",
    path,
    requestPayload: EmptyPayloadSchema,
    successResponsePayload,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

export const ResourceRestBindingOperationSchemas = {
  getResourcesForClass: resourceGetOperation("/classes/{classSourcedId}/resources", ResourceSetSchema),
  getResourcesForCourse: resourceGetOperation("/courses/{courseSourcedId}/resources", ResourceSetSchema),
  getAllResources: resourceGetOperation("/resources", ResourceSetSchema),
  getResource: resourceGetOperation("/resources/{sourcedId}", SingleResourceSchema),
  getResourcesForUser: resourceGetOperation("/users/{userSourcedId}/resources", ResourceSetSchema),
} as const;
