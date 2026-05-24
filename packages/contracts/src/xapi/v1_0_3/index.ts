export * from "../shared";

import {
  ActivitiesResourceQuerySchema,
  AboutResourceSchema,
  ActivityProfileDocumentListingQuerySchema,
  ActivityProfileDocumentQuerySchema,
  ActivitySchema,
  AgentAccountSchema,
  AgentsResourceQuerySchema,
  AgentProfileDocumentListingQuerySchema,
  AgentProfileDocumentQuerySchema,
  AgentSchema,
  AttachmentSchema,
  ContextActivitiesSchema,
  ContextSchema,
  GroupSchema,
  InteractionComponentSchema,
  InteractionTypeSchema,
  Iso8601DurationSchema,
  Iso8601TimestampSchema,
  LanguageMapSchema,
  LanguageTagSchema,
  NonEmptyStringSchema,
  PersonSchema,
  ResultSchema,
  ScoreSchema,
  StatementsQuerySchema,
  StatementObjectSchema,
  StatementResultSchema,
  StatementRefSchema,
  StatementSchema,
  StatementSubmissionSchema,
  StateDocumentListingQuerySchema,
  StateDocumentQuerySchema,
  SubStatementSchema,
  UuidSchema,
  VerbSchema,
  XapiDocumentSchema,
  XapiDocumentIdListSchema,
  IriSchema,
  XapiVersionSchema,
  XapiHttpMethodSchema,
  XapiResourceSchema,
  XapiRequestHeaderSchema,
  XapiResponseHeaderSchema,
  XapiErrorCodeSchema,
  XapiErrorResponseSchema,
  XapiConcurrencySchema,
  XapiMultipartAttachmentPartSchema,
  XapiMultipartRequestSchema,
} from "../shared";

export namespace XapiV1_0_3 {
  export namespace Schemas {
    export const AgentAccount = AgentAccountSchema;
    export const Agent = AgentSchema;
    export const Group = GroupSchema;
    export const Verb = VerbSchema;
    export const InteractionComponent = InteractionComponentSchema;
    export const Activity = ActivitySchema;
    export const StatementRef = StatementRefSchema;
    export const SubStatement = SubStatementSchema;
    export const Score = ScoreSchema;
    export const Result = ResultSchema;
    export const ContextActivities = ContextActivitiesSchema;
    export const Context = ContextSchema;
    export const Attachment = AttachmentSchema;
    export const StatementObject = StatementObjectSchema;
    export const Statement = StatementSchema;
    export const StatementSubmission = StatementSubmissionSchema;
    export const StatementResult = StatementResultSchema;
    export const Person = PersonSchema;
    export const AboutResource = AboutResourceSchema;
    export const StatementsQuery = StatementsQuerySchema;
    export const AgentsResourceQuery = AgentsResourceQuerySchema;
    export const ActivitiesResourceQuery = ActivitiesResourceQuerySchema;
    export const StateDocumentQuery = StateDocumentQuerySchema;
    export const StateDocumentListingQuery = StateDocumentListingQuerySchema;
    export const AgentProfileDocumentQuery = AgentProfileDocumentQuerySchema;
    export const AgentProfileDocumentListingQuery = AgentProfileDocumentListingQuerySchema;
    export const ActivityProfileDocumentQuery = ActivityProfileDocumentQuerySchema;
    export const ActivityProfileDocumentListingQuery = ActivityProfileDocumentListingQuerySchema;
    export const XapiDocument = XapiDocumentSchema;
    export const XapiDocumentIdList = XapiDocumentIdListSchema;
    export const HttpMethod = XapiHttpMethodSchema;
    export const Resource = XapiResourceSchema;
    export const RequestHeader = XapiRequestHeaderSchema;
    export const ResponseHeader = XapiResponseHeaderSchema;
    export const ErrorCode = XapiErrorCodeSchema;
    export const ErrorResponse = XapiErrorResponseSchema;
    export const Concurrency = XapiConcurrencySchema;
    export const MultipartAttachmentPart = XapiMultipartAttachmentPartSchema;
    export const MultipartRequest = XapiMultipartRequestSchema;
  }

  export namespace Shared {
    export const Uuid = UuidSchema;
    export const Version = XapiVersionSchema;
    export const Iri = IriSchema;
    export const LanguageTag = LanguageTagSchema;
    export const LanguageMap = LanguageMapSchema;
    export const Timestamp = Iso8601TimestampSchema;
    export const Duration = Iso8601DurationSchema;
    export const NonEmptyString = NonEmptyStringSchema;
    export const InteractionType = InteractionTypeSchema;
  }
}

export type XapiV1_0_3Schemas = typeof XapiV1_0_3.Schemas;

export const XapiV1_0_3DerivedZodTemplates = {
  description:
    "xAPI 1.0.3 Zod schemas for statements, statement result/person objects, document resources, LRS transport, and about metadata",
  specLinks: {
    about: "https://github.com/adlnet/xAPI-Spec/blob/ca782a1129bc6ae848640ff4e8e262334bdd0ba5/xAPI-About.md",
    data: "https://github.com/adlnet/xAPI-Spec/blob/ca782a1129bc6ae848640ff4e8e262334bdd0ba5/xAPI-Data.md",
    communication:
      "https://github.com/adlnet/xAPI-Spec/blob/ca782a1129bc6ae848640ff4e8e262334bdd0ba5/xAPI-Communication.md",
    lrsContent:
      "https://github.com/adlnet/xAPI-Spec/blob/ca782a1129bc6ae848640ff4e8e262334bdd0ba5/xAPI-Communication.md#lrs",
  },
  scope:
    "Statements, statement-like objects, statement result/person objects, statement and resource queries, LRS document resources and id lists, transport headers, concurrency control, multipart attachment handling, and about/version metadata",
  designNotes: [
    "Structured statement data is modeled strictly; document bodies are intentionally permissive because xAPI allows arbitrary document content types.",
    "Agent and Group validators require at least one identifier or member list, matching the data model intent rather than relying on shape alone.",
    "The transport- and header-level parts of the spec are represented as helper schemas rather than being forced into a single statement object.",
    "Concurrency control (ETags, If-Match/If-None-Match) and multipart attachment transmission are modeled as separate concerns for flexibility.",
    "Error codes and response envelopes follow HTTP semantics with explicit status codes and optional detail messaging.",
  ],
  coreSchemas: [
    "Agent",
    "Group",
    "Verb",
    "Activity",
    "SubStatement",
    "Result",
    "Context",
    "Attachment",
    "Statement",
    "StatementResult",
    "Person",
    "AboutResource",
    "StatementsQuery",
    "AgentsResourceQuery",
    "ActivitiesResourceQuery",
    "StateDocumentQuery",
    "StateDocumentListingQuery",
    "AgentProfileDocumentQuery",
    "AgentProfileDocumentListingQuery",
    "ActivityProfileDocumentQuery",
    "ActivityProfileDocumentListingQuery",
    "XapiDocumentIdList",
    "HttpMethod",
    "Resource",
    "RequestHeader",
    "ResponseHeader",
    "ErrorCode",
    "ErrorResponse",
    "Concurrency",
    "MultipartAttachmentPart",
    "MultipartRequest",
  ],
} as const;

export const Schemas = XapiV1_0_3.Schemas;
export const Shared = XapiV1_0_3.Shared;
export const DerivedZodTemplates = XapiV1_0_3DerivedZodTemplates;
