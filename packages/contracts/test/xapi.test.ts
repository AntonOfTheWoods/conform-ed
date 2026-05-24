import { expect, test } from "bun:test";
import { XapiV1_0_3, XapiV2_0 } from "@conform-ed/contracts";

const attachmentSha2 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const validStatement = {
  actor: {
    objectType: "Agent",
    mbox: "mailto:alice@example.com",
    name: "Alice",
  },
  verb: {
    id: "http://adlnet.gov/expapi/verbs/completed",
    display: { "en-US": "completed" },
  },
  object: {
    objectType: "Activity",
    id: "http://example.com/activities/course-1",
    definition: {
      name: { "en-US": "Course 1" },
      description: { "en-US": "Example course" },
      interactionType: "choice",
      correctResponsesPattern: ["a"],
      choices: [{ id: "a", description: { "en-US": "Choice A" } }],
    },
  },
  result: {
    score: { scaled: 1, raw: 100, min: 0, max: 100 },
    success: true,
    completion: true,
    duration: "PT1H",
  },
  context: {
    registration: "550e8400-e29b-41d4-a716-446655440000",
    platform: "conform-ed",
    language: "en-US",
    contextActivities: {
      parent: [{ id: "http://example.com/activities/course-1" }],
    },
  },
  timestamp: "2026-05-28T12:00:00.000Z",
  version: "1.0.3",
} as const;

test("xAPI 1.0.3 statement schema accepts the core data model", () => {
  expect(XapiV1_0_3.Schemas.Statement.safeParse(validStatement).success).toBe(true);
});

test("xAPI 2.0 statement schema accepts the same core data model", () => {
  expect(
    XapiV2_0.Schemas.Statement.safeParse({
      ...validStatement,
      version: "2.0",
    }).success,
  ).toBe(true);
});

test("xAPI 2.0 statement schema accepts IEEE 2.0 contextAgent/contextGroup objects", () => {
  const statementV2 = {
    ...validStatement,
    version: "2.0",
    context: {
      ...validStatement.context,
      contextAgents: [
        {
          objectType: "contextAgent",
          agent: {
            objectType: "Agent",
            mbox: "mailto:observer@example.com",
          },
          relevantTypes: ["https://example.com/xapi/relevant-types/observer"],
        },
      ],
      contextGroups: [
        {
          objectType: "contextGroup",
          group: {
            objectType: "Group",
            account: {
              homePage: "https://example.com/groups",
              name: "cohort-7",
            },
          },
          relevantTypes: ["https://example.com/xapi/relevant-types/cohort"],
        },
      ],
    },
  } as const;

  expect(XapiV2_0.Schemas.Statement.safeParse(statementV2).success).toBe(true);
  expect(XapiV2_0.Schemas.StatementSubmission.safeParse([statementV2]).success).toBe(true);
  expect(
    XapiV2_0.Schemas.StatementResult.safeParse({
      statements: [statementV2],
      more: "/xapi/statements?more=page-2",
    }).success,
  ).toBe(true);
  expect(
    XapiV2_0.Schemas.MultipartRequest.safeParse({
      contentType: "multipart/mixed",
      parts: [
        {
          contentType: "application/json",
          body: statementV2,
        },
        [
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Transfer-Encoding": "binary",
              "X-Experience-API-Hash": attachmentSha2,
            },
            body: new Uint8Array([0x7b, 0x7d]),
          },
        ],
      ],
    }).success,
  ).toBe(true);

  expect(XapiV1_0_3.Schemas.Statement.safeParse(statementV2).success).toBe(false);
});

test("xAPI statement submission schema accepts batches", () => {
  expect(XapiV1_0_3.Schemas.StatementSubmission.safeParse([validStatement]).success).toBe(true);
});

test("xAPI document, listing, and about schemas validate LRS metadata", () => {
  expect(
    XapiV1_0_3.Schemas.AboutResource.safeParse({
      version: ["1.0.3"],
      extensions: {
        "https://example.com/xapi/lrs/extensions/features": ["person", "statement-result"],
      },
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.StateDocumentQuery.safeParse({
      activityId: "http://example.com/activities/course-1",
      agent: { mbox: "mailto:alice@example.com" },
      registration: "550e8400-e29b-41d4-a716-446655440000",
      stateId: "progress",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.XapiDocument.safeParse({
      contentType: "application/json",
      body: { progress: 0.5 },
      etag: '"abc123"',
      lastModified: "2026-05-28T12:00:00.000Z",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.StateDocumentListingQuery.safeParse({
      activityId: "http://example.com/activities/course-1",
      agent: { mbox: "mailto:alice@example.com" },
      since: "2026-05-27T12:00:00.000Z",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.AgentProfileDocumentListingQuery.safeParse({
      agent: { mbox: "mailto:alice@example.com" },
      since: "2026-05-27T12:00:00.000Z",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.ActivityProfileDocumentListingQuery.safeParse({
      activityId: "http://example.com/activities/course-1",
      since: "2026-05-27T12:00:00.000Z",
    }).success,
  ).toBe(true);

  expect(XapiV1_0_3.Schemas.XapiDocumentIdList.safeParse(["bookmark", "progress"]).success).toBe(true);
});

test("xAPI validation rejects statements missing required fields", () => {
  expect(
    XapiV1_0_3.Schemas.Statement.safeParse({
      verb: { id: "http://adlnet.gov/expapi/verbs/completed" },
      object: { id: "http://example.com/activities/course-1" },
    }).success,
  ).toBe(false);
});

test("xAPI statement result, person object, and resource queries validate missing spec objects", () => {
  expect(
    XapiV1_0_3.Schemas.StatementResult.safeParse({
      statements: [validStatement],
      more: "/xapi/statements?more=opaque-token",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.StatementResult.safeParse({
      statements: [validStatement],
      more: "https://example.com/xapi/statements?more=absolute",
    }).success,
  ).toBe(false);

  expect(
    XapiV1_0_3.Schemas.Person.safeParse({
      objectType: "Person",
      name: ["Alice Example"],
      mbox: ["mailto:alice@example.com"],
      account: [
        {
          homePage: "https://example.com/accounts",
          name: "alice",
        },
      ],
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.AgentsResourceQuery.safeParse({
      agent: { mbox: "mailto:alice@example.com" },
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.ActivitiesResourceQuery.safeParse({
      activityId: "http://example.com/activities/course-1",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.StatementsQuery.safeParse({
      agent: { mbox: "mailto:alice@example.com" },
      verb: "http://adlnet.gov/expapi/verbs/completed",
      since: "2026-05-27T12:00:00.000Z",
      format: "canonical",
      attachments: true,
      ascending: false,
    }).success,
  ).toBe(true);
});

// LRS/Content schema tests
test("xAPI HTTP method enum validates LRS operations", () => {
  expect(XapiV1_0_3.Schemas.HttpMethod.safeParse("GET").success).toBe(true);
  expect(XapiV1_0_3.Schemas.HttpMethod.safeParse("POST").success).toBe(true);
  expect(XapiV1_0_3.Schemas.HttpMethod.safeParse("PUT").success).toBe(true);
  expect(XapiV1_0_3.Schemas.HttpMethod.safeParse("DELETE").success).toBe(true);
  expect(XapiV1_0_3.Schemas.HttpMethod.safeParse("PATCH").success).toBe(false);
});

test("xAPI error response schema validates LRS error payloads", () => {
  expect(
    XapiV1_0_3.Schemas.ErrorResponse.safeParse({
      code: "400",
      message: "Invalid request",
      details: "Missing required field: actor",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.ErrorResponse.safeParse({
      code: "500",
      message: "Internal server error",
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.ErrorResponse.safeParse({
      code: "400",
      message: "Invalid request",
      extra: "should not be here",
    }).success,
  ).toBe(false);
});

test("xAPI error codes validate standard HTTP status responses", () => {
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("400").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("401").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("403").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("404").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("412").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("500").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ErrorCode.safeParse("999").success).toBe(false);
});

test("xAPI concurrency schema validates ETags and conditional headers", () => {
  expect(
    XapiV1_0_3.Schemas.Concurrency.safeParse({
      etag: '"abc123"',
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.Concurrency.safeParse({
      ifMatch: '"abc123"',
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.Concurrency.safeParse({
      ifNoneMatch: '"abc123"',
    }).success,
  ).toBe(true);

  expect(XapiV1_0_3.Schemas.Concurrency.safeParse({}).success).toBe(true);
});

test("xAPI multipart attachment part schema validates attachment data structure", () => {
  expect(
    XapiV1_0_3.Schemas.MultipartAttachmentPart.safeParse({
      headers: {
        "Content-Type": "image/png",
        "Content-Transfer-Encoding": "binary",
        "X-Experience-API-Hash": attachmentSha2,
      },
      body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.MultipartAttachmentPart.safeParse({
      headers: {
        "Content-Type": "image/png",
        "Content-Transfer-Encoding": "base64",
        "X-Experience-API-Hash": attachmentSha2,
      },
      body: "iVBORw0KGgoAAAANSUhEUgAAAAUA",
    }).success,
  ).toBe(false);
});

test("xAPI multipart request schema validates statement with attachments", () => {
  expect(
    XapiV1_0_3.Schemas.MultipartRequest.safeParse({
      contentType: "multipart/mixed",
      parts: [
        {
          contentType: "application/json",
          body: validStatement,
        },
        [
          {
            headers: {
              "Content-Type": "image/png",
              "Content-Transfer-Encoding": "binary",
              "X-Experience-API-Hash": attachmentSha2,
            },
            body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
          },
        ],
      ],
    }).success,
  ).toBe(true);
});

test("xAPI resource schema models LRS endpoint definitions", () => {
  expect(
    XapiV1_0_3.Schemas.Resource.safeParse({
      name: "Statements",
      description: "Store and retrieve xAPI statements",
      methods: ["GET", "POST", "PUT"],
    }).success,
  ).toBe(true);

  expect(
    XapiV1_0_3.Schemas.Resource.safeParse({
      name: "Statements",
      description: "Store and retrieve xAPI statements",
      methods: [],
    }).success,
  ).toBe(false);
});

test("xAPI request and response headers are properly enumerated", () => {
  expect(XapiV1_0_3.Schemas.RequestHeader.safeParse("Authorization").success).toBe(true);
  expect(XapiV1_0_3.Schemas.RequestHeader.safeParse("If-Match").success).toBe(true);
  expect(XapiV1_0_3.Schemas.RequestHeader.safeParse("X-Experience-API-Hash").success).toBe(true);
  expect(XapiV1_0_3.Schemas.RequestHeader.safeParse("X-Experience-API-Version").success).toBe(true);
  expect(XapiV1_0_3.Schemas.RequestHeader.safeParse("Custom-Header").success).toBe(false);

  expect(XapiV1_0_3.Schemas.ResponseHeader.safeParse("ETag").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ResponseHeader.safeParse("X-Experience-API-Consistent-Through").success).toBe(true);
  expect(XapiV1_0_3.Schemas.ResponseHeader.safeParse("Authorization").success).toBe(false);
});
