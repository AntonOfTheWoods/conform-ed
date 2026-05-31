import { z } from "zod";

import { NonEmptyStringSchema, UriReferenceSchema, XmlExtensionNodeListSchema, strictObject } from "../shared";

export const AssignmentTextTypeSchema = z.enum(["text/plain", "text/html"]);
export const AssignmentAttachmentRoleSchema = z.enum(["All", "Learner", "Manager", "Instructor"]);
export const AssignmentSubmissionFormatTypeSchema = z.enum(["text", "html", "url", "file"]);

export const AssignmentTextSchema = strictObject({
  value: z.string(),
  texttype: AssignmentTextTypeSchema,
});

export const AssignmentAttachmentSchema = strictObject({
  href: UriReferenceSchema,
  role: AssignmentAttachmentRoleSchema,
});

export const AssignmentAttachmentsSchema = strictObject({
  attachment: z.array(AssignmentAttachmentSchema).min(1),
});

export const AssignmentSubmissionFormatSchema = strictObject({
  type: AssignmentSubmissionFormatTypeSchema,
});

export const AssignmentSubmissionFormatsSchema = strictObject({
  format: z.array(AssignmentSubmissionFormatSchema).min(1),
});

export const AssignmentExtensionsSchema = strictObject({
  platform: z.string().optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const AssignmentSchema = strictObject({
  identifier: NonEmptyStringSchema,
  title: z.string(),
  text: AssignmentTextSchema.optional(),
  instructor_text: AssignmentTextSchema.optional(),
  attachments: AssignmentAttachmentsSchema.optional(),
  gradable: z.boolean().optional(),
  submission_formats: AssignmentSubmissionFormatsSchema.optional(),
  extensions: AssignmentExtensionsSchema.optional(),
});

export const AssignmentDocumentSchema = strictObject({
  assignment: AssignmentSchema,
});
// Inferred types from exported Zod validators.
export type AssignmentTextType = z.infer<typeof AssignmentTextTypeSchema>;
export type AssignmentAttachmentRole = z.infer<typeof AssignmentAttachmentRoleSchema>;
export type AssignmentSubmissionFormatType = z.infer<typeof AssignmentSubmissionFormatTypeSchema>;
export type AssignmentText = z.infer<typeof AssignmentTextSchema>;
export type AssignmentAttachment = z.infer<typeof AssignmentAttachmentSchema>;
export type AssignmentAttachments = z.infer<typeof AssignmentAttachmentsSchema>;
export type AssignmentSubmissionFormat = z.infer<typeof AssignmentSubmissionFormatSchema>;
export type AssignmentSubmissionFormats = z.infer<typeof AssignmentSubmissionFormatsSchema>;
export type AssignmentExtensions = z.infer<typeof AssignmentExtensionsSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentDocument = z.infer<typeof AssignmentDocumentSchema>;
