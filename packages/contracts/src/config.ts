import { z } from "zod";

export const SuiteNameSchema = z.enum(["lrs", "cmi5", "lti13"]);

export const RunnerConfigSchema = z.object({
  contractVersion: z.string().default("1.0.0"),
  suite: z.object({
    name: SuiteNameSchema,
    target: z.string(),
  }),
  sut: z.record(z.string(), z.unknown()).default({}),
  auth: z.record(z.string(), z.unknown()).default({}),
  selection: z.record(z.string(), z.unknown()).default({}),
  timeouts: z.record(z.string(), z.unknown()).default({}),
  artifacts: z.record(z.string(), z.unknown()).default({}),
  debug: z.record(z.string(), z.unknown()).default({}),
  adapter: z.record(z.string(), z.unknown()).nullable().default(null),
  suiteConfig: z.record(z.string(), z.unknown()).default({}),
});

export type RunnerConfig = z.infer<typeof RunnerConfigSchema>;
