import { z } from "zod";

export const SuiteNameSchema = z.enum(["lrs", "cmi5", "lti13"]);
export const LogLevelSchema = z.enum(["error", "warn", "info", "debug"]);

const RequirementIdArraySchema = z.array(z.string().min(1)).min(1);

const TimeoutsSchema = z
  .object({
    connectMs: z.number().int().min(100).max(120_000).default(5_000),
    readMs: z.number().int().min(100).max(120_000).default(30_000),
    operationMs: z.number().int().min(100).max(600_000).default(120_000),
    assertionMs: z.number().int().min(100).max(600_000).default(60_000),
    retryMaxAttempts: z.number().int().min(0).max(10).default(2),
    retryBackoffMs: z.number().int().min(0).max(60_000).default(1_000),
  })
  .default(() => ({
    connectMs: 5_000,
    readMs: 30_000,
    operationMs: 120_000,
    assertionMs: 60_000,
    retryMaxAttempts: 2,
    retryBackoffMs: 1_000,
  }));

const ArtifactsSchema = z.object({
  outputDir: z.string().min(1),
  summaryFile: z.string().min(1).default("summary.json"),
  junitFile: z.string().min(1).default("junit.xml"),
  requirementTraceFile: z.string().min(1).default("requirement-trace.json"),
  runMetadataFile: z.string().min(1).default("run-metadata.json"),
});

const AdapterSchema = z
  .object({
    kind: z.literal("http").default("http"),
    baseUrl: z.url(),
    profileVersion: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/u)
      .default("1.0.0"),
    auth: z
      .object({
        mode: z.enum(["none", "bearer"]).default("bearer"),
        tokenFromEnv: z.string().min(1).optional(),
      })
      .default((): { mode: "none" | "bearer"; tokenFromEnv?: string } => ({
        mode: "bearer" as const,
      })),
    requiredCapabilities: z.array(z.string().min(1)).default([]),
  })
  .nullable()
  .default(null)
  .superRefine((adapter, context) => {
    if (!adapter) {
      return;
    }
    if (adapter.auth.mode === "bearer" && !adapter.auth.tokenFromEnv) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "adapter.auth.tokenFromEnv is required when adapter.auth.mode is bearer",
        path: ["auth", "tokenFromEnv"],
      });
    }
  });

export const RunnerConfigSchema = z
  .object({
    contractVersion: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/u)
      .default("1.0.0"),
    suite: z.object({
      name: SuiteNameSchema,
      target: z.string().min(1),
    }),
    sut: z.record(z.string(), z.unknown()),
    auth: z.record(z.string(), z.unknown()).default({}),
    selection: z
      .object({
        includeRequirementIds: RequirementIdArraySchema.optional(),
        excludeRequirementIds: RequirementIdArraySchema.optional(),
      })
      .default({}),
    timeouts: TimeoutsSchema,
    artifacts: ArtifactsSchema,
    debug: z
      .object({
        logLevel: LogLevelSchema.default("info"),
        redactionEnabled: z.boolean().default(true),
      })
      .default((): { logLevel: z.infer<typeof LogLevelSchema>; redactionEnabled: boolean } => ({
        logLevel: "info" as const,
        redactionEnabled: true,
      })),
    adapter: AdapterSchema,
    suiteConfig: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((config, context) => {
    if (config.suite.name === "cmi5") {
      if (!["runtime", "package", "all"].includes(config.suite.target)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "suite.target must be runtime, package, or all when suite.name is cmi5",
          path: ["suite", "target"],
        });
      }
      if (!config.adapter) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "adapter is required when suite.name is cmi5",
          path: ["adapter"],
        });
      }
    }
  });

export type RunnerConfig = z.infer<typeof RunnerConfigSchema>;
