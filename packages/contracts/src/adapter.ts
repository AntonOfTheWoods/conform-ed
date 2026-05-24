import { z } from "zod";

export const AdapterProfileSuiteSchema = z.enum(["cmi5", "lti13", "lrs"]);
export const AdapterTransportSchema = z.enum(["http-json"]);
export const StatementRetrievalModeSchema = z.enum(["adapter-api"]);
export const PackageUploadModeSchema = z.enum(["inline-base64"]);

export const AdapterErrorCategorySchema = z.enum([
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "upstream_unavailable",
  "internal",
]);

export const AdapterCapabilitySchema = z.object({
  profileVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  adapterName: z.string().min(1),
  adapterVersion: z.string().min(1),
  operations: z.array(z.string().min(1)),
  profiles: z.array(z.string().min(1)).default([]),
  optionalFeatures: z.array(z.string().min(1)).default([]),
});

export const AdapterOperationSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  method: z.enum(["GET", "POST"]),
  description: z.string().min(1).optional(),
});

export const AdapterProfileSchema = z
  .object({
    contractVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    profileVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    suite: AdapterProfileSuiteSchema,
    adapter: z.object({
      name: z.string().min(1),
      version: z.string().min(1),
      transport: AdapterTransportSchema,
    }),
    interoperability: z.object({
      statementRetrieval: StatementRetrievalModeSchema,
      packageUpload: PackageUploadModeSchema.optional(),
    }),
    operations: z.array(AdapterOperationSchema).min(1),
    artifacts: z.object({
      requirementTraceRequired: z.literal(true),
    }),
  })
  .superRefine((profile, context) => {
    if (profile.suite === "cmi5" && profile.interoperability.packageUpload !== "inline-base64") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "interoperability.packageUpload must be inline-base64 for cmi5 profiles",
        path: ["interoperability", "packageUpload"],
      });
    }
  });

export const AdapterErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    category: AdapterErrorCategorySchema,
    retriable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
    upstreamStatus: z.number().int().optional(),
  }),
});

export type AdapterCapability = z.infer<typeof AdapterCapabilitySchema>;
export type AdapterOperation = z.infer<typeof AdapterOperationSchema>;
export type AdapterProfile = z.infer<typeof AdapterProfileSchema>;
export type AdapterError = z.infer<typeof AdapterErrorSchema>;
