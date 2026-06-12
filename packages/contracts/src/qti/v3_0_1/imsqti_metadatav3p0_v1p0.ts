import { z } from "zod";

import { strictObject } from "./shared";

export const QtiMetadataInteractionTypeSchema = z.enum([
  "associateInteraction",
  "choiceInteraction",
  "customInteraction",
  "drawingInteraction",
  "endAttemptInteraction",
  "extendedTextInteraction",
  "gapMatchInteraction",
  "graphicAssociateInteraction",
  "graphicGapMatchInteraction",
  "graphicOrderInteraction",
  "hotspotInteraction",
  "hottextInteraction",
  "inlineChoiceInteraction",
  "matchInteraction",
  "mediaInteraction",
  "orderInteraction",
  "portableCustomInteraction",
  "positionObjectInteraction",
  "selectPointInteraction",
  "sliderInteraction",
  "textEntryInteraction",
  "uploadInteraction",
]);

export const QtiMetadataFeedbackTypeSchema = z.enum(["adaptive", "nonadaptive", "none"]);

export const QtiMetadataScoringModeSchema = z.enum(["human", "externalmachine", "responseprocessing"]);

export const QtiPortableCustomInteractionContextSchema = strictObject({
  customTypeIdentifier: z.string().optional(),
  interactionKind: z.string().optional(),
});

export const QtiMetadataSchema = strictObject({
  itemTemplate: z.boolean().optional(),
  timeDependent: z.boolean().optional(),
  composite: z.boolean().optional(),
  interactionType: z.array(QtiMetadataInteractionTypeSchema).optional(),
  portableCustomInteractionContext: QtiPortableCustomInteractionContextSchema.optional(),
  feedbackType: QtiMetadataFeedbackTypeSchema.optional(),
  solutionAvailable: z.boolean().optional(),
  scoringMode: z.array(QtiMetadataScoringModeSchema).optional(),
  toolName: z.string().max(256).optional(),
  toolVersion: z.string().max(256).optional(),
  toolVendor: z.string().max(256).optional(),
}).superRefine((value, context) => {
  const hasPortableCustomInteraction = value.interactionType?.includes("portableCustomInteraction") ?? false;

  if (value.portableCustomInteractionContext && !hasPortableCustomInteraction) {
    context.addIssue({
      code: "custom",
      path: ["portableCustomInteractionContext"],
      message:
        "portableCustomInteractionContext is only valid when interactionType includes portableCustomInteraction.",
    });
  }
});

export const QtiMetadataDocumentSchema = strictObject({
  qtiMetadata: QtiMetadataSchema,
});
// Inferred types from exported Zod validators.
export type QtiMetadataInteractionType = z.infer<typeof QtiMetadataInteractionTypeSchema>;
export type QtiMetadataFeedbackType = z.infer<typeof QtiMetadataFeedbackTypeSchema>;
export type QtiMetadataScoringMode = z.infer<typeof QtiMetadataScoringModeSchema>;
export type QtiPortableCustomInteractionContext = z.infer<typeof QtiPortableCustomInteractionContextSchema>;
export type QtiMetadata = z.infer<typeof QtiMetadataSchema>;
export type QtiMetadataDocument = z.infer<typeof QtiMetadataDocumentSchema>;
