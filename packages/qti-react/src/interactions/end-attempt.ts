import { z } from "zod";

import { defineInteraction } from "../runtime";
import type { ResponseValue } from "../types";

const endAttemptInteractionNodeSchema = z.object({
  kind: z.literal("endAttemptInteraction"),
  responseIdentifier: z.string().min(1),
  title: z.string().min(1),
});

export const endAttemptInteraction = defineInteraction({
  kind: "endAttemptInteraction",
  schema: endAttemptInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
