import { z } from "zod";

import { defineInteraction, type InteractionDescriptor } from "../runtime";
import type { ResponseValue } from "../types";

const drawingInteractionNodeSchema = z.object({
  kind: z.literal("drawingInteraction"),
  responseIdentifier: z.string().min(1),
  object: z.object({
    data: z.string().min(1),
    width: z.number().optional(),
    height: z.number().optional(),
    type: z.string().optional(),
  }),
});

export const drawingInteraction: InteractionDescriptor<"drawingInteraction"> = defineInteraction({
  kind: "drawingInteraction",
  schema: drawingInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
