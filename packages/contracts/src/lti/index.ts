export * from "./shared";
export * from "./v1_3";
export * from "./deep-linking/v2_0";
export * from "./ags/v2_0";
export * from "./nrps/v2_0";
export * from "./proctoring/v1_0";

export * as V1_3 from "./v1_3";
export * as DeepLinkingV2_0 from "./deep-linking/v2_0";
export * as AgsV2_0 from "./ags/v2_0";
export * as NrpsV2_0 from "./nrps/v2_0";
export * as ProctoringV1_0 from "./proctoring/v1_0";

import { Lti13DerivedZodTemplates } from "./v1_3";
import { LtiDeepLinkingV2_0DerivedZodTemplates } from "./deep-linking/v2_0";
import { LtiAgsV2_0DerivedZodTemplates } from "./ags/v2_0";
import { LtiNrpsV2_0DerivedZodTemplates } from "./nrps/v2_0";
import { LtiProctoringV1_0DerivedZodTemplates } from "./proctoring/v1_0";

export const LtiDerivedZodTemplates = {
  core: Lti13DerivedZodTemplates,
  deepLinking: LtiDeepLinkingV2_0DerivedZodTemplates,
  ags: LtiAgsV2_0DerivedZodTemplates,
  nrps: LtiNrpsV2_0DerivedZodTemplates,
  proctoring: LtiProctoringV1_0DerivedZodTemplates,
} as const;
