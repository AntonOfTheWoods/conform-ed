import { AdapterCapabilitySchema } from "@conform-ed/contracts";
import { capabilities } from "../capabilities";

export function capabilitiesRoute(): Response {
  return Response.json(AdapterCapabilitySchema.parse(capabilities));
}
