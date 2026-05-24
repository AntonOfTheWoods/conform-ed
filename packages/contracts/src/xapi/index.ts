export * from "./shared";

export * as V1_0_3 from "./v1_0_3";
export * as V2_0 from "./v2_0";

import { XapiV1_0_3DerivedZodTemplates } from "./v1_0_3";
import { XapiV2_0DerivedZodTemplates } from "./v2_0";

export const XapiDerivedZodTemplates = {
  v1_0_3: XapiV1_0_3DerivedZodTemplates,
  v2_0: XapiV2_0DerivedZodTemplates,
} as const;
