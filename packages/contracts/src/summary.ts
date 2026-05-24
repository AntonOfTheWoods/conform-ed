import { z } from "zod";

export const RunnerSummarySchema = z.object({
  contractVersion: z.string(),
  runner: z.object({
    suite: z.string(),
    version: z.string(),
  }),
  result: z.object({
    status: z.enum(["passed", "failed", "error"]),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
});

export type RunnerSummary = z.infer<typeof RunnerSummarySchema>;
