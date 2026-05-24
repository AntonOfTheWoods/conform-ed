export * from "./ob_v3p0_achievementcredential_schema";
export * from "./ob_v3p0_endorsementcredential_schema";
export * from "./ob_v3p0_profile_schema";
export * from "./ob_v3p0_getopenbadgecredentialsresponse_schema";
export * from "./ob_v3p0_imsx_statusinfo_schema";

import { AchievementCredentialSchema, OpenBadgeCredentialSchema } from "./ob_v3p0_achievementcredential_schema";
import { EndorsementCredentialSchema } from "./ob_v3p0_endorsementcredential_schema";
import { GetOpenBadgeCredentialsResponseSchema } from "./ob_v3p0_getopenbadgecredentialsresponse_schema";
import { ImsxStatusInfoSchema } from "./ob_v3p0_imsx_statusinfo_schema";
import { ProfileSchema } from "./ob_v3p0_profile_schema";

export const OpenBadges30DerivedZodTemplates = {
  achievementCredential: AchievementCredentialSchema,
  openBadgeCredential: OpenBadgeCredentialSchema,
  endorsementCredential: EndorsementCredentialSchema,
  getOpenBadgeCredentialsResponse: GetOpenBadgeCredentialsResponseSchema,
  profile: ProfileSchema,
  imsxStatusInfo: ImsxStatusInfoSchema,
} as const;
