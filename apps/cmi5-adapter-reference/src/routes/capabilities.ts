import { capabilities } from "../capabilities";

export function capabilitiesRoute(): Response {
  return Response.json(capabilities);
}
