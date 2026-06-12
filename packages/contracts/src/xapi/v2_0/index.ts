export * from "../shared";

import { z } from "zod";

import {
  strictObject,
  ActivitiesResourceQuerySchema,
  AboutResourceSchema,
  ActivityProfileDocumentListingQuerySchema,
  ActivityProfileDocumentQuerySchema,
  ActivitySchema,
  AgentAccountSchema,
  AgentProfileDocumentListingQuerySchema,
  AgentProfileDocumentQuerySchema,
  AgentSchema,
  AgentsResourceQuerySchema,
  AttachmentSchema,
  ContextActivitiesSchema,
  ContextSchema,
  GroupSchema,
  InteractionComponentSchema,
  InteractionTypeSchema,
  IriSchema,
  Iso8601DurationSchema,
  Iso8601TimestampSchema,
  LanguageMapSchema,
  LanguageTagSchema,
  NonEmptyStringSchema,
  PersonSchema,
  ResultSchema,
  ScoreSchema,
  StatementsQuerySchema,
  StatementRefSchema,
  StatementResultMoreSchema,
  StateDocumentListingQuerySchema,
  StateDocumentQuerySchema,
  UuidSchema,
  VerbSchema,
  XapiConcurrencySchema,
  XapiDocumentIdListSchema,
  XapiDocumentSchema,
  XapiErrorCodeSchema,
  XapiErrorResponseSchema,
  XapiHttpMethodSchema,
  XapiMultipartAttachmentPartSchema,
  XapiRequestHeaderSchema,
  XapiResourceSchema,
  XapiResponseHeaderSchema,
  XapiVersionSchema,
  AgentAsObjectSchema,
  GroupAsObjectSchema,
} from "../shared";

export const ContextAgentSchema = strictObject({
  objectType: z.literal("contextAgent"),
  agent: AgentSchema,
  relevantTypes: z.array(IriSchema).min(1).optional(),
});

export const ContextGroupSchema = strictObject({
  objectType: z.literal("contextGroup"),
  group: GroupSchema,
  relevantTypes: z.array(IriSchema).min(1).optional(),
});

export const ContextV2Schema = ContextSchema.extend({
  contextAgents: z.array(ContextAgentSchema).min(1).optional(),
  contextGroups: z.array(ContextGroupSchema).min(1).optional(),
});

export const SubStatementV2Schema = strictObject({
  objectType: z.literal("SubStatement"),
  actor: z.union([AgentSchema, GroupSchema]),
  verb: VerbSchema,
  object: z.union([ActivitySchema, AgentAsObjectSchema, GroupAsObjectSchema, StatementRefSchema]),
  result: ResultSchema.optional(),
  context: ContextV2Schema.optional(),
  timestamp: Iso8601TimestampSchema.optional(),
});

export const StatementObjectV2Schema = z.union([
  ActivitySchema,
  AgentAsObjectSchema,
  GroupAsObjectSchema,
  StatementRefSchema,
  SubStatementV2Schema,
]);

export const StatementV2Schema = strictObject({
  id: UuidSchema.optional(),
  actor: z.union([AgentSchema, GroupSchema]),
  verb: VerbSchema,
  object: StatementObjectV2Schema,
  result: ResultSchema.optional(),
  context: ContextV2Schema.optional(),
  timestamp: Iso8601TimestampSchema.optional(),
  stored: Iso8601TimestampSchema.optional(),
  authority: z.union([AgentSchema, GroupSchema]).optional(),
  version: XapiVersionSchema.optional(),
  attachments: z.array(AttachmentSchema).min(1).optional(),
});

export const StatementSubmissionV2Schema = z.union([StatementV2Schema, z.array(StatementV2Schema).min(1)]);

export const StatementResultV2Schema = strictObject({
  statements: z.array(StatementV2Schema),
  more: StatementResultMoreSchema.optional(),
});

export const XapiMultipartRequestV2Schema = strictObject({
  contentType: z.literal("multipart/mixed"),
  parts: z.tuple([
    strictObject({
      contentType: z.literal("application/json"),
      body: z.union([StatementV2Schema, z.array(StatementV2Schema).min(1)]),
    }),
    z.array(XapiMultipartAttachmentPartSchema).min(1),
  ]),
});

export const XapiV2_0 = {
  Schemas: {
    AgentAccount: AgentAccountSchema,
    Agent: AgentSchema,
    Group: GroupSchema,
    Person: PersonSchema,
    Verb: VerbSchema,
    InteractionComponent: InteractionComponentSchema,
    Activity: ActivitySchema,
    StatementRef: StatementRefSchema,
    ContextAgent: ContextAgentSchema,
    ContextGroup: ContextGroupSchema,
    SubStatement: SubStatementV2Schema,
    Score: ScoreSchema,
    Result: ResultSchema,
    ContextActivities: ContextActivitiesSchema,
    Context: ContextV2Schema,
    Attachment: AttachmentSchema,
    StatementObject: StatementObjectV2Schema,
    Statement: StatementV2Schema,
    StatementSubmission: StatementSubmissionV2Schema,
    StatementResult: StatementResultV2Schema,
    AboutResource: AboutResourceSchema,
    StatementsQuery: StatementsQuerySchema,
    AgentsResourceQuery: AgentsResourceQuerySchema,
    ActivitiesResourceQuery: ActivitiesResourceQuerySchema,
    StateDocumentQuery: StateDocumentQuerySchema,
    StateDocumentListingQuery: StateDocumentListingQuerySchema,
    AgentProfileDocumentQuery: AgentProfileDocumentQuerySchema,
    AgentProfileDocumentListingQuery: AgentProfileDocumentListingQuerySchema,
    ActivityProfileDocumentQuery: ActivityProfileDocumentQuerySchema,
    ActivityProfileDocumentListingQuery: ActivityProfileDocumentListingQuerySchema,
    XapiDocument: XapiDocumentSchema,
    XapiDocumentIdList: XapiDocumentIdListSchema,
    HttpMethod: XapiHttpMethodSchema,
    Resource: XapiResourceSchema,
    RequestHeader: XapiRequestHeaderSchema,
    ResponseHeader: XapiResponseHeaderSchema,
    ErrorCode: XapiErrorCodeSchema,
    ErrorResponse: XapiErrorResponseSchema,
    Concurrency: XapiConcurrencySchema,
    MultipartAttachmentPart: XapiMultipartAttachmentPartSchema,
    MultipartRequest: XapiMultipartRequestV2Schema,
  },

  Shared: {
    Uuid: UuidSchema,
    Version: XapiVersionSchema,
    Iri: IriSchema,
    LanguageTag: LanguageTagSchema,
    LanguageMap: LanguageMapSchema,
    Timestamp: Iso8601TimestampSchema,
    Duration: Iso8601DurationSchema,
    NonEmptyString: NonEmptyStringSchema,
    InteractionType: InteractionTypeSchema,
  },
} as const;

export type XapiV2_0Schemas = typeof XapiV2_0.Schemas;

export const XapiV2_0DerivedZodTemplates = {
  description:
    "IEEE xAPI 2.0 Zod schemas for statements, 2.0 context objects, statement result/person objects, document resources, LRS transport, and about metadata",
  specLinks: {
    overview:
      "https://github.com/madebyraygun/xapi-base-standard-documentation/blob/134afd8c108b4d1b98294a1613db38a6b8fe73d8/9274.1.1%20xAPI%20Base%20Standard%20Overview.md",
    content:
      "https://github.com/madebyraygun/xapi-base-standard-documentation/blob/134afd8c108b4d1b98294a1613db38a6b8fe73d8/9274.1.1%20xAPI%20Base%20Standard%20for%20Content.md",
    lrs: "https://github.com/madebyraygun/xapi-base-standard-documentation/blob/134afd8c108b4d1b98294a1613db38a6b8fe73d8/9274.1.1%20xAPI%20Base%20Standard%20for%20LRSs.md",
  },
  scope:
    "Statements, IEEE 2.0 contextAgent/contextGroup objects, statement result/person objects, statement and resource queries, LRS document resources and id lists, transport headers, concurrency control, multipart attachment handling, and service metadata for IEEE xAPI 2.0",
  designNotes: [
    "The 2.0 bundle reuses the 1.0.3 data model where the standard remains structurally equivalent, but overrides Context, SubStatement, Statement, StatementSubmission, StatementResult, and multipart request schemas to capture 2.0-only contextAgent/contextGroup support.",
    "Version-specific differences are isolated in the package boundary and documentation rather than duplicated across the shared primitives.",
    "Transport-level concerns such as headers and concurrency are represented as companion helper schemas rather than being merged into statement data.",
    "LRS resource and concurrency models follow HTTP semantics with ETags, conditional requests (If-Match/If-None-Match), and standard error codes including 412 Precondition Failed.",
  ],
  coreSchemas: [
    "Agent",
    "Group",
    "Person",
    "Verb",
    "Activity",
    "ContextAgent",
    "ContextGroup",
    "SubStatement",
    "Result",
    "Context",
    "Attachment",
    "Statement",
    "StatementResult",
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

export {
  ContextV2Schema as ContextSchema,
  StatementObjectV2Schema as StatementObjectSchema,
  StatementResultV2Schema as StatementResultSchema,
  StatementSubmissionV2Schema as StatementSubmissionSchema,
  StatementV2Schema as StatementSchema,
  SubStatementV2Schema as SubStatementSchema,
  XapiMultipartRequestV2Schema as XapiMultipartRequestSchema,
};

export const Schemas = XapiV2_0.Schemas;
export const Shared = XapiV2_0.Shared;
export const DerivedZodTemplates = XapiV2_0DerivedZodTemplates;
// Inferred types from exported Zod validators.
export type ContextAgent = z.infer<typeof ContextAgentSchema>;
export type ContextGroup = z.infer<typeof ContextGroupSchema>;
export type ContextV2 = z.infer<typeof ContextV2Schema>;
export type SubStatementV2 = z.infer<typeof SubStatementV2Schema>;
export type StatementObjectV2 = z.infer<typeof StatementObjectV2Schema>;
export type StatementV2 = z.infer<typeof StatementV2Schema>;
export type StatementSubmissionV2 = z.infer<typeof StatementSubmissionV2Schema>;
export type StatementResultV2 = z.infer<typeof StatementResultV2Schema>;
export type XapiMultipartRequestV2 = z.infer<typeof XapiMultipartRequestV2Schema>;
