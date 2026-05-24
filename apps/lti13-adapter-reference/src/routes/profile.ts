import { AdapterProfileSchema } from "@conform-ed/contracts";
import { profile } from "../profile";

export function profileRoute(): Response {
  return Response.json(AdapterProfileSchema.parse(profile));
}
