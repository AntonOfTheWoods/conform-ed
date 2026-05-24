import { z } from "zod";

export const RunnerSummarySchema = z.object({
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  runner: z.object({
    suite: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/u),
    profileVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    target: z.string().min(1),
  }),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  result: z.object({
    status: z.enum(["passed", "failed", "error"]),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
  adapter: z
    .object({
      name: z.string().min(1),
      version: z.string().min(1),
      profileVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    })
    .optional(),
  artifacts: z.object({
    summaryFile: z.string().min(1),
    junitFile: z.string().min(1),
    requirementTraceFile: z.string().min(1),
    runMetadataFile: z.string().min(1),
  }),
});

export const RequirementTraceSchema = z.object({
  contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  runId: z.string().min(1),
  requirements: z.record(
    z.string().min(1),
    z.object({
      status: z.enum(["passed", "failed", "skipped", "error"]),
      evidence: z.array(z.string().min(1)).default([]),
      message: z.string().optional(),
    }),
  ),
});

export const RunMetadataSchema = z.object({
  runId: z.string().min(1),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  image: z.object({
    reference: z.string().min(1),
    digest: z.string().min(1),
    source: z.string().min(1),
  }),
  standards: z.object({
    suiteSourceRevision: z.string().min(1),
    requirementsRevision: z.string().min(1),
    profileVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  }),
  runner: z.object({
    version: z.string().min(1),
    revision: z.string().min(1),
  }),
});

export type RunnerSummary = z.infer<typeof RunnerSummarySchema>;
export type RequirementTrace = z.infer<typeof RequirementTraceSchema>;
export type RunMetadata = z.infer<typeof RunMetadataSchema>;
