export * from "../../shared";

import { z } from "zod";

import {
  ContextSchema,
  CustomParametersSchema,
  LaunchPresentationSchema,
  LisSchema,
  NonEmptyStringSchema,
  ResourceLinkSchema,
  RolesSchema,
  UrlSchema,
  LtiVersionSchema,
  strictObject,
} from "../../shared";

export const AssessmentControlSeveritySchema = z.enum(["low", "medium", "high"]);

export const AssessmentProctoringSettingsSchema = strictObject({
  proctoringUrl: UrlSchema.optional(),
  startAssessmentUrl: UrlSchema.optional(),
  endAssessmentReturnUrl: UrlSchema.optional(),
  assessmentControlUrl: UrlSchema.optional(),
  sessionData: NonEmptyStringSchema.optional(),
  extraTime: z.number().int().nonnegative().optional(),
});

export const StartProctoringMessageSchema = strictObject({
  messageType: z.literal("StartProctoringMessage"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema,
  targetLinkUri: UrlSchema,
  resourceLink: ResourceLinkSchema,
  subject: NonEmptyStringSchema,
  attemptNumber: z.number().int().positive(),
  startAssessmentUrl: UrlSchema,
  sessionData: NonEmptyStringSchema,
  roles: RolesSchema,
  context: ContextSchema.optional(),
  launchPresentation: LaunchPresentationSchema.optional(),
  lis: LisSchema.optional(),
  custom: CustomParametersSchema.optional(),
  assessmentProctoringSettings: AssessmentProctoringSettingsSchema.optional(),
});

export const StartAssessmentMessageSchema = strictObject({
  messageType: z.literal("StartAssessmentMessage"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema,
  resourceLink: ResourceLinkSchema,
  subject: NonEmptyStringSchema,
  attemptNumber: z.number().int().positive(),
  sessionData: NonEmptyStringSchema,
  endAssessmentReturnUrl: UrlSchema,
  verifiedUser: z.union([z.boolean(), NonEmptyStringSchema]).optional(),
  context: ContextSchema.optional(),
  launchPresentation: LaunchPresentationSchema.optional(),
  lis: LisSchema.optional(),
  custom: CustomParametersSchema.optional(),
  assessmentProctoringSettings: AssessmentProctoringSettingsSchema.optional(),
});

export const EndAssessmentMessageSchema = strictObject({
  messageType: z.literal("EndAssessmentMessage"),
  version: LtiVersionSchema,
  deploymentId: NonEmptyStringSchema,
  targetLinkUri: UrlSchema,
  subject: NonEmptyStringSchema,
  attemptNumber: z.number().int().positive(),
  roles: RolesSchema,
  context: ContextSchema.optional(),
  launchPresentation: LaunchPresentationSchema.optional(),
  lis: LisSchema.optional(),
  custom: CustomParametersSchema.optional(),
  assessmentProctoringSettings: AssessmentProctoringSettingsSchema.optional(),
  errorMessage: z.string().optional(),
  errorLog: z.string().optional(),
});

export const AssessmentControlRequestSchema = strictObject({
  user: NonEmptyStringSchema,
  resourceLink: NonEmptyStringSchema,
  attemptNumber: z.number().int().positive(),
  action: NonEmptyStringSchema,
  incidentTime: z.iso.datetime(),
  extraTime: z.number().int().nonnegative().optional(),
  incidentSeverity: AssessmentControlSeveritySchema.optional(),
  reasonCode: NonEmptyStringSchema.optional(),
  reasonMsg: z.string().optional(),
});

export const AssessmentControlResponseSchema = strictObject({
  status: NonEmptyStringSchema,
  extraTime: z.number().int().nonnegative().optional(),
});

export const LtiProctoringV1_0 = {
  Schemas: {
    AssessmentProctoringSettings: AssessmentProctoringSettingsSchema,
    StartProctoringMessage: StartProctoringMessageSchema,
    StartAssessmentMessage: StartAssessmentMessageSchema,
    EndAssessmentMessage: EndAssessmentMessageSchema,
    AssessmentControlRequest: AssessmentControlRequestSchema,
    AssessmentControlResponse: AssessmentControlResponseSchema,
    AssessmentControlSeverity: AssessmentControlSeveritySchema,
  },
} as const;

export type LtiProctoringV1_0Schemas = typeof LtiProctoringV1_0.Schemas;

export const LtiProctoringV1_0DerivedZodTemplates = {
  description: "LTI Proctoring v1.0 Zod schemas for normalized start/end assessment message payloads",
  specLinks: {
    main: "https://www.imsglobal.org/spec/proctoring/v1p0/",
  },
  scope: "Proctoring launch messages and assessment-control service payloads",
  claims: ["assessment_proctoring_settings", "attempt_number"],
  notes: [
    "The specification is still in candidate-final/public form, so the schema favors normalized compatibility over an exact JSON Schema mirror.",
    "Control-service parameters are modeled separately from launch message payloads to keep request/response contracts explicit.",
  ],
} as const;
// Inferred types from exported Zod validators.
export type AssessmentControlSeverity = z.infer<typeof AssessmentControlSeveritySchema>;
export type AssessmentProctoringSettings = z.infer<typeof AssessmentProctoringSettingsSchema>;
export type StartProctoringMessage = z.infer<typeof StartProctoringMessageSchema>;
export type StartAssessmentMessage = z.infer<typeof StartAssessmentMessageSchema>;
export type EndAssessmentMessage = z.infer<typeof EndAssessmentMessageSchema>;
export type AssessmentControlRequest = z.infer<typeof AssessmentControlRequestSchema>;
export type AssessmentControlResponse = z.infer<typeof AssessmentControlResponseSchema>;
