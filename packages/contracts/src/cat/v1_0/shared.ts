import { z } from "zod";

function strictObject<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}

function extensibleEnum<Values extends readonly [string, ...string[]]>(values: Values) {
  return z.union([z.enum(values), ExtensibleVocabularyValueSchema]);
}

// Shared validators
export const UuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[8-9a-b][0-9a-f]{3}-[0-9a-f]{12}$/u);
const UriSchema = z.string().regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/u);
export const DateTimeSchema = z.iso.datetime({ offset: true });

const ExtensibleVocabularyValueSchema = z.string().regex(/^(ext:)[a-zA-Z0-9.\-_]+$/u);

export const ExtensionEnumSchema = extensibleEnum;

// Assessment Result status values
const ASSESSMENT_RESULT_TYPES = ["active", "complete", "incomplete", "paused", "terminated", "pending"] as const;

// Outcome variable types in CAT
const OUTCOME_VARIABLE_TYPES = [
  "float",
  "integer",
  "boolean",
  "string",
  "point",
  "duration",
  "pair",
  "directedPair",
  "ordered",
  "multiple",
  "record",
] as const;

// Cardinality types for outcome variables
const OUTCOME_CARDINALITY_TYPES = ["single", "multiple", "ordered", "record"] as const;

export const OutcomeVariableTypeSchema = extensibleEnum(OUTCOME_VARIABLE_TYPES);
export const OutcomeCardinalitySchema = extensibleEnum(OUTCOME_CARDINALITY_TYPES);
export const AssessmentResultTypeSchema = extensibleEnum(ASSESSMENT_RESULT_TYPES);

// Outcome variable value (can be various types)
const OutcomeValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/**
 * Outcome variable - represents a QTI outcome variable from assessment results
 */
export const OutcomeVariableSchema = strictObject({
  identifier: z.string(),
  cardinality: OutcomeCardinalitySchema,
  baseType: OutcomeVariableTypeSchema,
  value: z.union([OutcomeValueSchema, z.array(OutcomeValueSchema)]).optional(),
});

/**
 * Response variable - represents a candidate response to an item
 */
export const ResponseVariableSchema = strictObject({
  identifier: z.string(),
  cardinality: OutcomeCardinalitySchema,
  baseType: z.string(),
  value: z.union([OutcomeValueSchema, z.array(OutcomeValueSchema)]).optional(),
});

/**
 * Item reference in the item pool
 */
export const ItemRefSchema = strictObject({
  identifier: z.string(),
  href: UriSchema,
});

/**
 * CAT constraint - defines rules for item selection
 */
export const CatConstraintSchema = strictObject({
  type: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Item pool - references to available items for adaptive selection
 */
export const ItemPoolSchema = strictObject({
  itemRefs: z.array(ItemRefSchema),
});

/**
 * Adaptive section configuration - contains all parameters needed by CAT engine
 */
export const SectionDataSchema = strictObject({
  // Unique identifier for the section in the assessment
  sectionIdentifier: z.string(),

  // Unique identifier for this particular adaptive section instance
  assessmentSectionId: UuidSchema,

  // URI pointing to the section resource (QTI or content package)
  sectionHref: UriSchema,

  // Item pool with available items
  itemPool: ItemPoolSchema,

  // CAT constraints (e.g., maximum items, target ability, etc.)
  constraints: z.array(CatConstraintSchema).optional(),

  // Optional item metadata (e.g., IRT parameters, CSM mappings)
  itemMetadata: z.record(z.string(), z.unknown()).optional(),

  // Optional user demographics for personalization
  demographics: z.record(z.string(), z.unknown()).optional(),

  // Custom CAT engine parameters (engine-specific)
  customParameters: z.record(z.string(), z.unknown()).optional(),

  // Creation timestamp
  createdAt: DateTimeSchema,
});

/**
 * Item stage - one or more items to present to the candidate
 */
export const ItemStageSchema = strictObject({
  // Unique identifier for this item stage
  stageId: UuidSchema,

  // The items to present in this stage
  items: z.array(ItemRefSchema),

  // Whether the candidate must complete all items in this stage before proceeding
  mustCompleteAll: z.boolean().optional().default(false),

  // Position of this stage in the test sequence
  stagePosition: z.number().int().positive().optional(),

  // Total number of stages expected (null if unknown)
  stagesTotal: z.number().int().positive().nullable().optional(),

  // Adaptive section ID this stage belongs to
  assessmentSectionId: UuidSchema,

  // Custom properties for the CAT engine
  customProperties: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Assessment result from platform - candidate responses to items
 */
export const AssessmentResultSchema = strictObject({
  // Unique identifier for this result
  resultId: UuidSchema,

  // The assessment section this result is for
  assessmentSectionId: UuidSchema,

  // The items being responded to
  itemsAttempted: z.array(
    strictObject({
      itemRef: ItemRefSchema,
      attemptNumber: z.number().int().positive(),
    }),
  ),

  // Candidate responses to items
  responseVariables: z.array(ResponseVariableSchema).optional(),

  // Outcome variables generated by item processing (e.g., item scores)
  outcomeVariables: z.array(OutcomeVariableSchema).optional(),

  // Whether the candidate is continuing (true) or finishing (false)
  continuationRequired: z.boolean(),

  // Timestamp of this result submission
  submittedAt: DateTimeSchema,
});

/**
 * Result report from CAT engine - recommendations and scoring
 */
export const CatEngineResultReportSchema = strictObject({
  // Unique identifier for this report
  reportId: UuidSchema,

  // Assessment section ID
  assessmentSectionId: UuidSchema,

  // Estimated ability of the candidate (IRT theta estimate)
  estimatedAbility: z.number().optional(),

  // Standard error of ability estimate
  abilityStandardError: z.number().optional(),

  // Overall score/outcome for the section
  sectionScore: z.number().optional(),

  // Outcome variables to be delivered to the platform
  outcomeVariables: z.array(OutcomeVariableSchema).optional(),

  // Recommendation (e.g., "continue", "finish")
  recommendation: z.enum(["continue", "finish", "suspend", "abandon"]),

  // Optional next item stage to present
  nextStage: ItemStageSchema.optional(),

  // Optional diagnostic information
  diagnosticData: z.record(z.string(), z.unknown()).optional(),

  // Timestamp of report generation
  generatedAt: DateTimeSchema,
});

/**
 * Session information for CAT delivery
 */
export const SessionInfoSchema = strictObject({
  // Unique session identifier
  sessionId: UuidSchema,

  // Assessment section ID for this session
  assessmentSectionId: UuidSchema,

  // Candidate/user identifier
  candidateId: z.string(),

  // Current session status
  status: AssessmentResultTypeSchema,

  // Number of items completed so far
  itemsCompleted: z.number().int().nonnegative(),

  // When session started
  startedAt: DateTimeSchema,

  // When session ended (null if still active)
  endedAt: DateTimeSchema.nullable().optional(),

  // Custom session data
  customData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Request payloads for CAT operations
 */

export const CreateSectionRequestSchema = strictObject({
  sectionData: SectionDataSchema,
});

export const GetSectionRequestSchema = strictObject({
  sectionId: UuidSchema,
});

export const CreateSessionRequestSchema = strictObject({
  assessmentSectionId: UuidSchema,
  candidateId: z.string(),
  demographics: z.record(z.string(), z.unknown()).optional(),
});

export const SubmitResultsRequestSchema = strictObject({
  sessionId: UuidSchema,
  result: AssessmentResultSchema,
});

export const EndSessionRequestSchema = strictObject({
  sessionId: UuidSchema,
  status: AssessmentResultTypeSchema.optional(),
});

export const EndSectionRequestSchema = strictObject({
  sectionId: UuidSchema,
});

/**
 * Response payloads for CAT operations
 */

export const CreateSectionResponseSchema = strictObject({
  sectionId: UuidSchema,
  status: z.literal("created"),
});

export const GetSectionResponseSchema = SectionDataSchema;

export const CreateSessionResponseSchema = strictObject({
  sessionId: UuidSchema,
  status: z.literal("active"),
});

export const SubmitResultsResponseSchema = CatEngineResultReportSchema;

export const EndSessionResponseSchema = strictObject({
  sessionId: UuidSchema,
  status: z.literal("ended"),
  finalReport: CatEngineResultReportSchema.optional(),
});

export const EndSectionResponseSchema = strictObject({
  sectionId: UuidSchema,
  status: z.literal("ended"),
});

/**
 * Error response
 */
export const ErrorResponseSchema = strictObject({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  details: z.record(z.string(), z.unknown()).optional(),
});
// Inferred types from exported Zod validators.
export type Uuid = z.infer<typeof UuidSchema>;
export type DateTime = z.infer<typeof DateTimeSchema>;
export type ExtensionEnum = z.infer<typeof ExtensionEnumSchema>;
export type OutcomeVariableType = z.infer<typeof OutcomeVariableTypeSchema>;
export type OutcomeCardinality = z.infer<typeof OutcomeCardinalitySchema>;
export type AssessmentResultType = z.infer<typeof AssessmentResultTypeSchema>;
export type OutcomeVariable = z.infer<typeof OutcomeVariableSchema>;
export type ResponseVariable = z.infer<typeof ResponseVariableSchema>;
export type ItemRef = z.infer<typeof ItemRefSchema>;
export type CatConstraint = z.infer<typeof CatConstraintSchema>;
export type ItemPool = z.infer<typeof ItemPoolSchema>;
export type SectionData = z.infer<typeof SectionDataSchema>;
export type ItemStage = z.infer<typeof ItemStageSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
export type CatEngineResultReport = z.infer<typeof CatEngineResultReportSchema>;
export type SessionInfo = z.infer<typeof SessionInfoSchema>;
export type CreateSectionRequest = z.infer<typeof CreateSectionRequestSchema>;
export type GetSectionRequest = z.infer<typeof GetSectionRequestSchema>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
export type SubmitResultsRequest = z.infer<typeof SubmitResultsRequestSchema>;
export type EndSessionRequest = z.infer<typeof EndSessionRequestSchema>;
export type EndSectionRequest = z.infer<typeof EndSectionRequestSchema>;
export type CreateSectionResponse = z.infer<typeof CreateSectionResponseSchema>;
export type GetSectionResponse = z.infer<typeof GetSectionResponseSchema>;
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;
export type SubmitResultsResponse = z.infer<typeof SubmitResultsResponseSchema>;
export type EndSessionResponse = z.infer<typeof EndSessionResponseSchema>;
export type EndSectionResponse = z.infer<typeof EndSectionResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
