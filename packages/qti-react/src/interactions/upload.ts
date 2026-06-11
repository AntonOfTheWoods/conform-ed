import { z } from "zod";

import { defineInteraction } from "../runtime";
import type { ResponseValue } from "../types";

const uploadInteractionNodeSchema = z.object({
  kind: z.literal("uploadInteraction"),
  responseIdentifier: z.string().min(1),
  type: z.string().optional(),
});

export const uploadInteraction = defineInteraction({
  kind: "uploadInteraction",
  schema: uploadInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
