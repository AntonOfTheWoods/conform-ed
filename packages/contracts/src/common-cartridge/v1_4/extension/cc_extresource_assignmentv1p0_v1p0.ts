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
