import { describe, it, expect } from "bun:test";
import { CatV1_0 } from "../src/cat/v1_0/index";

describe("CAT v1.0 Zod Schemas", () => {
  // Shared validator tests
  describe("Shared validators", () => {
    it("UuidSchema validates RFC4122 compliant UUIDs", () => {
      const uuid = CatV1_0.Shared.Uuid;
      expect(uuid.parse("550e8400-e29b-41d4-a716-446655440000")).toBeDefined();
      expect(() => uuid.parse("not-a-uuid")).toThrow();
      expect(() => uuid.parse("550e8400-e29b-41d4-7716-446655440000")).toThrow(); // Invalid variant
    });

    it("DateTimeSchema validates ISO8601 datetimes", () => {
      const dt = CatV1_0.Shared.DateTime;
      expect(dt.parse("2026-05-28T15:07:29Z")).toBeDefined();
      expect(dt.parse("2026-05-28T15:07:29.742+08:00")).toBeDefined();
      expect(() => dt.parse("2026-05-28")).toThrow();
      expect(() => dt.parse("not-a-date")).toThrow();
    });

    it("ExtensionEnum supports standard values and ext:* vendor extensions", () => {
      const enumSchema = CatV1_0.Shared.ExtensionEnum(["standard", "value"]);
      expect(enumSchema.parse("standard")).toBe("standard");
      expect(enumSchema.parse("ext:custom-vendor-extension")).toBe("ext:custom-vendor-extension");
      expect(() => enumSchema.parse("unknown-value")).toThrow();
    });

    it("OutcomeVariableType supports outcome types and vendor extensions", () => {
      expect(CatV1_0.Shared.OutcomeVariableType.parse("float")).toBe("float");
      expect(CatV1_0.Shared.OutcomeVariableType.parse("string")).toBe("string");
      expect(CatV1_0.Shared.OutcomeVariableType.parse("ext:custom-type")).toBe("ext:custom-type");
    });
  });

  // Data type tests
  describe("Core data types", () => {
    it("OutcomeVariable validates outcome variable structure", () => {
      const outcomeVar = {
        identifier: "SCORE",
        cardinality: "single",
        baseType: "float",
        value: 85.5,
      };
      expect(CatV1_0.Schemas.OutcomeVariable.parse(outcomeVar)).toBeDefined();
    });

    it("OutcomeVariable rejects additional properties", () => {
      const outcomeVar = {
        identifier: "SCORE",
        cardinality: "single",
        baseType: "float",
        value: 85.5,
        extraField: "should-fail",
      };
      expect(() => CatV1_0.Schemas.OutcomeVariable.parse(outcomeVar)).toThrow();
    });

    it("ResponseVariable validates candidate responses", () => {
      const response = {
        identifier: "RESPONSE_1",
        cardinality: "single",
        baseType: "identifier",
        value: "choice_a",
      };
      expect(CatV1_0.Schemas.ResponseVariable.parse(response)).toBeDefined();
    });

    it("ItemRef validates item references", () => {
      const itemRef = {
        identifier: "item_1",
        href: "http://example.com/item/item_1.xml",
      };
      expect(CatV1_0.Schemas.ItemRef.parse(itemRef)).toBeDefined();
    });

    it("ItemPool validates item pool with multiple items", () => {
      const itemPool = {
        itemRefs: [
          { identifier: "item_1", href: "http://example.com/item/item_1.xml" },
          { identifier: "item_2", href: "http://example.com/item/item_2.xml" },
          { identifier: "item_3", href: "http://example.com/item/item_3.xml" },
        ],
      };
      expect(CatV1_0.Schemas.ItemPool.parse(itemPool)).toBeDefined();
    });

    it("SectionData validates complete section configuration", () => {
      const sectionData = {
        sectionIdentifier: "adaptive_section_1",
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440000",
        sectionHref: "http://example.com/section/adaptive_section_1.xml",
        itemPool: {
          itemRefs: [
            { identifier: "item_1", href: "http://example.com/item/item_1.xml" },
            { identifier: "item_2", href: "http://example.com/item/item_2.xml" },
          ],
        },
        createdAt: "2026-05-28T15:07:29Z",
      };
      expect(CatV1_0.Schemas.SectionData.parse(sectionData)).toBeDefined();
    });

    it("ItemStage validates items to present to candidate", () => {
      const itemStage = {
        stageId: "550e8400-e29b-41d4-a716-446655440000",
        items: [
          { identifier: "item_1", href: "http://example.com/item/item_1.xml" },
          { identifier: "item_2", href: "http://example.com/item/item_2.xml" },
        ],
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440001",
      };
      expect(CatV1_0.Schemas.ItemStage.parse(itemStage)).toBeDefined();
    });

    it("AssessmentResult validates candidate responses and outcomes", () => {
      const result = {
        resultId: "550e8400-e29b-41d4-a716-446655440000",
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440001",
        itemsAttempted: [
          {
            itemRef: {
              identifier: "item_1",
              href: "http://example.com/item/item_1.xml",
            },
            attemptNumber: 1,
          },
        ],
        responseVariables: [
          {
            identifier: "RESPONSE_1",
            cardinality: "single",
            baseType: "identifier",
            value: "choice_a",
          },
        ],
        outcomeVariables: [
          {
            identifier: "SCORE",
            cardinality: "single",
            baseType: "float",
            value: 1.0,
          },
        ],
        continuationRequired: true,
        submittedAt: "2026-05-28T15:07:29Z",
      };
      expect(CatV1_0.Schemas.AssessmentResult.parse(result)).toBeDefined();
    });

    it("CatEngineResultReport validates CAT engine response", () => {
      const report = {
        reportId: "550e8400-e29b-41d4-a716-446655440000",
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440001",
        estimatedAbility: 0.45,
        abilityStandardError: 0.32,
        sectionScore: 72.5,
        recommendation: "continue",
        generatedAt: "2026-05-28T15:07:29Z",
      };
      expect(CatV1_0.Schemas.CatEngineResultReport.parse(report)).toBeDefined();
    });

    it("SessionInfo validates session state", () => {
      const session = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440001",
        candidateId: "candidate_123",
        status: "active",
        itemsCompleted: 3,
        startedAt: "2026-05-28T15:00:00Z",
      };
      expect(CatV1_0.Schemas.SessionInfo.parse(session)).toBeDefined();
    });
  });

  // Request/response validation tests
  describe("REST operation payloads", () => {
    it("CreateSectionRequest validates section creation", () => {
      const request = {
        sectionData: {
          sectionIdentifier: "adaptive_section_1",
          assessmentSectionId: "550e8400-e29b-41d4-a716-446655440000",
          sectionHref: "http://example.com/section/adaptive_section_1.xml",
          itemPool: {
            itemRefs: [{ identifier: "item_1", href: "http://example.com/item/item_1.xml" }],
          },
          createdAt: "2026-05-28T15:07:29Z",
        },
      };
      expect(CatV1_0.Schemas.CreateSectionRequest.parse(request)).toBeDefined();
    });

    it("CreateSectionResponse validates section creation response", () => {
      const response = {
        sectionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "created",
      };
      expect(CatV1_0.Schemas.CreateSectionResponse.parse(response)).toBeDefined();
    });

    it("CreateSessionRequest validates session creation", () => {
      const request = {
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440000",
        candidateId: "candidate_123",
      };
      expect(CatV1_0.Schemas.CreateSessionRequest.parse(request)).toBeDefined();
    });

    it("CreateSessionResponse validates session creation response", () => {
      const response = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
      };
      expect(CatV1_0.Schemas.CreateSessionResponse.parse(response)).toBeDefined();
    });

    it("SubmitResultsRequest validates result submission", () => {
      const request = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        result: {
          resultId: "550e8400-e29b-41d4-a716-446655440001",
          assessmentSectionId: "550e8400-e29b-41d4-a716-446655440002",
          itemsAttempted: [
            {
              itemRef: {
                identifier: "item_1",
                href: "http://example.com/item/item_1.xml",
              },
              attemptNumber: 1,
            },
          ],
          continuationRequired: true,
          submittedAt: "2026-05-28T15:07:29Z",
        },
      };
      expect(CatV1_0.Schemas.SubmitResultsRequest.parse(request)).toBeDefined();
    });

    it("SubmitResultsResponse validates CAT engine result report", () => {
      const response = {
        reportId: "550e8400-e29b-41d4-a716-446655440000",
        assessmentSectionId: "550e8400-e29b-41d4-a716-446655440001",
        recommendation: "finish",
        generatedAt: "2026-05-28T15:07:29Z",
      };
      expect(CatV1_0.Schemas.SubmitResultsResponse.parse(response)).toBeDefined();
    });

    it("EndSessionRequest validates session termination", () => {
      const request = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
      };
      expect(CatV1_0.Schemas.EndSessionRequest.parse(request)).toBeDefined();
    });

    it("EndSessionResponse validates session termination response", () => {
      const response = {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "ended",
      };
      expect(CatV1_0.Schemas.EndSessionResponse.parse(response)).toBeDefined();
    });

    it("EndSectionRequest validates section closure", () => {
      const request = {
        sectionId: "550e8400-e29b-41d4-a716-446655440000",
      };
      expect(CatV1_0.Schemas.EndSectionRequest.parse(request)).toBeDefined();
    });

    it("EndSectionResponse validates section closure response", () => {
      const response = {
        sectionId: "550e8400-e29b-41d4-a716-446655440000",
        status: "ended",
      };
      expect(CatV1_0.Schemas.EndSectionResponse.parse(response)).toBeDefined();
    });
  });

  // REST operations catalog test
  describe("REST operation bindings", () => {
    it("REST operation catalog exposes all 6 CAT operations", () => {
      const ops = CatV1_0.RestBinding.Operations;
      expect(ops.createSection).toBeDefined();
      expect(ops.getSection).toBeDefined();
      expect(ops.createSession).toBeDefined();
      expect(ops.submitResults).toBeDefined();
      expect(ops.endSession).toBeDefined();
      expect(ops.endSection).toBeDefined();
    });

    it("CreateSection operation has correct structure", () => {
      const op = CatV1_0.RestBinding.Operations.createSection;
      expect(op.method).toBe("POST");
      expect(op.path).toBe("/sections");
      expect(op.requestPayload).toBeDefined();
      expect(op.successResponsePayload).toBeDefined();
    });

    it("SubmitResults operation has correct path template", () => {
      const op = CatV1_0.RestBinding.Operations.submitResults;
      expect(op.path).toBe("/sessions/{sessionId}/results");
      expect(op.method).toBe("POST");
    });
  });

  // Derived templates test
  describe("Derived templates", () => {
    it("Cat10DerivedZodTemplates exposes specification metadata", () => {
      const templates = require("../src/cat/v1_0/index").Cat10DerivedZodTemplates;
      expect(templates.description).toBeDefined();
      expect(templates.specLinks).toBeDefined();
      expect(templates.scope).toBeDefined();
      expect(templates.coreEntities).toBeDefined();
      expect(templates.restOperations).toBeDefined();
    });

    it("Specification links point to official CAT v1.0 resources", () => {
      const templates = require("../src/cat/v1_0/index").Cat10DerivedZodTemplates;
      expect(templates.specLinks.main).toContain("imsglobal.org");
      expect(templates.specLinks.main).toContain("cat");
      expect(templates.specLinks.main).toContain("v1p0");
    });
  });

  // Error response test
  describe("Error handling", () => {
    it("ErrorResponse validates error payloads", () => {
      const error = {
        error: "INVALID_SECTION",
        message: "The specified section does not exist",
        statusCode: 404,
      };
      expect(CatV1_0.Schemas.ErrorResponse.parse(error)).toBeDefined();
    });
  });
});
