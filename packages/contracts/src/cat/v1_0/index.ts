import {
  UuidSchema,
  DateTimeSchema,
  ExtensionEnumSchema,
  OutcomeVariableSchema,
  ResponseVariableSchema,
  ItemRefSchema,
  CatConstraintSchema,
  ItemPoolSchema,
  SectionDataSchema,
  ItemStageSchema,
  AssessmentResultSchema,
  CatEngineResultReportSchema,
  SessionInfoSchema,
  CreateSectionRequestSchema,
  CreateSectionResponseSchema,
  GetSectionRequestSchema,
  GetSectionResponseSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  SubmitResultsRequestSchema,
  SubmitResultsResponseSchema,
  EndSessionRequestSchema,
  EndSessionResponseSchema,
  EndSectionRequestSchema,
  EndSectionResponseSchema,
  ErrorResponseSchema,
  OutcomeVariableTypeSchema,
  OutcomeCardinalitySchema,
  AssessmentResultTypeSchema,
} from "./shared";
import { CatV1P0RestBindingOperations } from "./cat_v1p0_restbinding_operations_schema";

export namespace CatV1_0 {
  export namespace Schemas {
    // Request schemas
    export const CreateSectionRequest = CreateSectionRequestSchema;
    export const GetSectionRequest = GetSectionRequestSchema;
    export const CreateSessionRequest = CreateSessionRequestSchema;
    export const SubmitResultsRequest = SubmitResultsRequestSchema;
    export const EndSessionRequest = EndSessionRequestSchema;
    export const EndSectionRequest = EndSectionRequestSchema;

    // Response schemas
    export const CreateSectionResponse = CreateSectionResponseSchema;
    export const GetSectionResponse = GetSectionResponseSchema;
    export const CreateSessionResponse = CreateSessionResponseSchema;
    export const SubmitResultsResponse = SubmitResultsResponseSchema;
    export const EndSessionResponse = EndSessionResponseSchema;
    export const EndSectionResponse = EndSectionResponseSchema;

    // Data type schemas
    export const OutcomeVariable = OutcomeVariableSchema;
    export const ResponseVariable = ResponseVariableSchema;
    export const ItemRef = ItemRefSchema;
    export const CatConstraint = CatConstraintSchema;
    export const ItemPool = ItemPoolSchema;
    export const SectionData = SectionDataSchema;
    export const ItemStage = ItemStageSchema;
    export const AssessmentResult = AssessmentResultSchema;
    export const CatEngineResultReport = CatEngineResultReportSchema;
    export const SessionInfo = SessionInfoSchema;
    export const ErrorResponse = ErrorResponseSchema;
  }

  export namespace Shared {
    export const Uuid = UuidSchema;
    export const DateTime = DateTimeSchema;
    export const ExtensionEnum = ExtensionEnumSchema;
    export const OutcomeVariableType = OutcomeVariableTypeSchema;
    export const OutcomeCardinality = OutcomeCardinalitySchema;
    export const AssessmentResultType = AssessmentResultTypeSchema;
  }

  export namespace RestBinding {
    export const Operations = CatV1P0RestBindingOperations;
  }
}

export type CatV1_0Schemas = typeof CatV1_0.Schemas;

export const Cat10DerivedZodTemplates = {
  description: "CAT v1.0 Zod schemas derived from official 1EdTech CAT Specification",
  specLinks: {
    main: "https://www.imsglobal.org/spec/cat/v1p0/impl/",
    errata: "https://www.imsglobal.org/spec/cat/v1p0/errata/",
  },
  scope: "Computer Adaptive Testing (CAT) REST API for item selection and delivery delegation",
  coreEntities: [
    "SectionData - Adaptive section configuration and item pool",
    "ItemStage - Set of items to present to candidate",
    "AssessmentResult - Candidate responses and item processing results",
    "CatEngineResultReport - CAT engine scoring and recommendations",
    "SessionInfo - Session state and context",
  ],
  restOperations: [
    "POST /sections - Create adaptive section",
    "GET /sections/:id - Retrieve section configuration",
    "POST /sessions - Create new session",
    "POST /sessions/:id/results - Submit responses and get next items",
    "POST /sessions/:id/end - Terminate session",
    "POST /sections/:id/end - Close section",
  ],
  designNotes: [
    "Strict validation (.strict()) enforces exact schema conformance with specification",
    "Extensible enums support vendor-specific values via ext:* pattern",
    "UUID validators enforce RFC4122 v1-v5 format compliance",
    "DateTime validators enforce ISO8601 format with optional timezone",
    "All request/response payloads are JSON objects (no XML)",
    "CAT engine treated as black box - input/output contracts standardized, internal algorithms not",
    "Support for custom parameters allows CAT engines to require engine-specific configuration",
  ],
  knownLimitations: [
    "This version focuses on core 6 operations - may not cover all CAT engine extensions",
    "Custom parameters are typed as z.record(z.string(), z.unknown()) - consider stricter validation for specific CAT engines",
    "Item metadata format is flexible (z.record) - specific metadata types not yet standardized",
  ],
  futureEnhancements: [
    "Define standardized CustomParameters interfaces for common CAT engines",
    "Add ItemMetadata schema for QTI metadata bindings",
    "Support for QTI Usage Data (Item Statistics) vocabulary",
    "Support for CSM (Curriculum Standards Mapping) vocabulary",
  ],
};
