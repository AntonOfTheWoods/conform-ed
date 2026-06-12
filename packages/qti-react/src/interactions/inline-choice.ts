import { z } from "zod";

import { defineInteraction, type InteractionDescriptor } from "../runtime";
import type { ResponseValue } from "../types";

const inlineChoiceInteractionNodeSchema = z.object({
  kind: z.literal("inlineChoiceInteraction"),
  responseIdentifier: z.string().min(1),
  inlineChoices: z.array(z.object({ identifier: z.string().min(1) })).min(1),
});

export const inlineChoiceInteraction: InteractionDescriptor<"inlineChoiceInteraction"> = defineInteraction({
  kind: "inlineChoiceInteraction",
  schema: inlineChoiceInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
