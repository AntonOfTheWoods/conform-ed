import { z } from "zod";

import { defineInteraction, type InteractionDescriptor } from "../runtime";
import type { ResponseValue } from "../types";

const sliderInteractionNodeSchema = z.object({
  kind: z.literal("sliderInteraction"),
  responseIdentifier: z.string().min(1),
  lowerBound: z.number(),
  upperBound: z.number(),
  step: z.number().optional(),
  stepLabel: z.boolean().optional(),
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  reverse: z.boolean().optional(),
});

export const sliderInteraction: InteractionDescriptor<"sliderInteraction"> = defineInteraction({
  kind: "sliderInteraction",
  schema: sliderInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
