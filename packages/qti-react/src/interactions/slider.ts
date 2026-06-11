import { z } from "zod";

import { defineInteraction } from "../runtime";
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

export const sliderInteraction = defineInteraction({
  kind: "sliderInteraction",
  schema: sliderInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
