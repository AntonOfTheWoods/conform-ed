import { z } from "zod";

import { NonEmptyStringSchema, UriReferenceSchema, XmlExtensionNodeListSchema, strictObject } from "../shared";

export const DiscussionTopicAttachmentSchema = strictObject({
  href: UriReferenceSchema,
});

export const DiscussionTopicAttachmentsSchema = strictObject({
  attachment: z.array(DiscussionTopicAttachmentSchema).min(1),
});

export const DiscussionTopicTextSchema = strictObject({
  value: z.string(),
  texttype: z.enum(["text/plain", "text/html"]),
});

export const DiscussionTopicSchema = strictObject({
  title: NonEmptyStringSchema,
  text: DiscussionTopicTextSchema,
  attachments: DiscussionTopicAttachmentsSchema.optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const DiscussionTopicDocumentSchema = strictObject({
  topic: DiscussionTopicSchema,
});
// Inferred types from exported Zod validators.
export type DiscussionTopicAttachment = z.infer<typeof DiscussionTopicAttachmentSchema>;
export type DiscussionTopicAttachments = z.infer<typeof DiscussionTopicAttachmentsSchema>;
export type DiscussionTopicText = z.infer<typeof DiscussionTopicTextSchema>;
export type DiscussionTopic = z.infer<typeof DiscussionTopicSchema>;
export type DiscussionTopicDocument = z.infer<typeof DiscussionTopicDocumentSchema>;
