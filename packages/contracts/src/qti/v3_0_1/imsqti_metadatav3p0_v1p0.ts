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
      code: z.ZodIssueCode.custom,
      path: ["portableCustomInteractionContext"],
      message:
        "portableCustomInteractionContext is only valid when interactionType includes portableCustomInteraction.",
    });
  }
});

export const QtiMetadataDocumentSchema = strictObject({
  qtiMetadata: QtiMetadataSchema,
});
