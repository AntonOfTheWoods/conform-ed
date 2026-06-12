import { z } from "zod";

import { defineInteraction, type InteractionDescriptor } from "../runtime";
import type { ResponseValue } from "../types";

const textEntryInteractionNodeSchema = z.object({
  kind: z.literal("textEntryInteraction"),
  responseIdentifier: z.string().min(1),
  expectedLength: z.number().int().optional(),
  placeholderText: z.string().optional(),
  patternMask: z.string().optional(),
});

export const textEntryInteraction: InteractionDescriptor<"textEntryInteraction"> = defineInteraction({
  kind: "textEntryInteraction",
  schema: textEntryInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
