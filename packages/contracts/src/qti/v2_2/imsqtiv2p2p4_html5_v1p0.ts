import type { z } from "zod";
export const QtiHtml5ContentNodeSchema = qti22Schemas.QtiContentNodeSchema;
export const QtiHtml5StimulusBodySchema = qti22Schemas.QtiStimulusBodySchema;

import { qti22Schemas } from "./schemas";
// Inferred types from exported Zod validators.
export type QtiHtml5ContentNode = z.infer<typeof QtiHtml5ContentNodeSchema>;
export type QtiHtml5StimulusBody = z.infer<typeof QtiHtml5StimulusBodySchema>;
