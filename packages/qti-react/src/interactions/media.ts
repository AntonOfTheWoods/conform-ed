import { z } from "zod";

import { defineInteraction } from "../runtime";
import type { ResponseValue } from "../types";

const mediaInteractionNodeSchema = z.object({
  kind: z.literal("mediaInteraction"),
  responseIdentifier: z.string().min(1),
  autostart: z.boolean().optional(),
  minPlays: z.number().int().optional(),
  maxPlays: z.number().int().optional(),
  loop: z.boolean().optional(),
  // Flow content containing the audio/video element the interaction wraps.
  content: z.array(z.looseObject({ kind: z.string().min(1) })).min(1),
});

export const mediaInteraction = defineInteraction({
  kind: "mediaInteraction",
  schema: mediaInteractionNodeSchema,
  scoring: "qti-standard",
  initialResponse(): ResponseValue {
    return null;
  },
});
