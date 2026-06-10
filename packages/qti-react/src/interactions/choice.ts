import { z } from "zod";

import { defineInteraction } from "../runtime";
import type { ResponseValue } from "../types";

/** Minimal node shape the runtime/skin rely on; whole-item validation uses the contract. */
const choiceInteractionNodeSchema = z.object({
  kind: z.literal("choiceInteraction"),
  responseIdentifier: z.string().min(1),
  simpleChoices: z.array(z.object({ identifier: z.string().min(1) })).min(1),
  maxChoices: z.number().int().optional(),
});

export const choiceInteraction = defineInteraction({
  kind: "choiceInteraction",
  schema: choiceInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
