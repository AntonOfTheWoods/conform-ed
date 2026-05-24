import { expect, test, describe } from "bun:test";

import { CaseV1_1, Case11DerivedZodTemplates } from "@conform-ed/contracts/case/v1_1";

describe("CASE v1.1 Schemas", () => {
  describe("Core entity schemas", () => {
    test("should validate a valid CFAssociation", () => {
      const association = {
        identifier: "3d8235b4-7f2c-4b8d-9e1a-2c5f3b6d7a8e",
        associationType: "isChildOf",
        uri: "http://example.org/cf/associations/1",
        originNodeURI: {
          title: "Origin",
          identifier: "4e9346c5-8e3d-5c9e-0f2b-3d6e4c7e8b9f",
          uri: "http://example.org/origin",
        },
        destinationNodeURI: {
          title: "Destination",
          identifier: "5f0457d6-9f4e-6d0f-1f3c-4e7f5d8f9c0f",
          uri: "http://example.org/destination",
        },
        lastChangeDateTime: "2024-01-15T10:30:00Z",
      };

      const result = CaseV1_1.Schemas.CFAssociation.safeParse(association);
      expect(result.success).toBe(true);
    });

    test("should reject CFAssociation with invalid UUID", () => {
      const association = {
        identifier: "invalid-uuid",
        associationType: "isChildOf",
        uri: "http://example.org/cf/associations/1",
        originNodeURI: {
          title: "Origin",
          identifier: "invalid",
          uri: "http://example.org/origin",
        },
        destinationNodeURI: {
          title: "Destination",
          identifier: "invalid",
          uri: "http://example.org/destination",
        },
        lastChangeDateTime: "2024-01-15T10:30:00Z",
      };

      const result = CaseV1_1.Schemas.CFAssociation.safeParse(association);
      expect(result.success).toBe(false);
    });
  });

  describe("REST binding operations", () => {
    test("should expose getCFAssociation operation", () => {
      const op = CaseV1_1.RestBinding.Operations.getCFAssociation;
      expect(op.method).toBe("GET");
      expect(op.path).toContain("/cfAssociations/");
    });

    test("should expose listCFAssociations operation", () => {
      const op = CaseV1_1.RestBinding.Operations.listCFAssociations;
      expect(op.method).toBe("GET");
      expect(op.path).toBe("/cfAssociations");
    });

    test("should expose getCFPackage operation", () => {
      const op = CaseV1_1.RestBinding.Operations.getCFPackage;
      expect(op.method).toBe("GET");
      expect(op.path).toContain("/cfPackages/");
    });

    test("should expose listCFItems operation", () => {
      const op = CaseV1_1.RestBinding.Operations.listCFItems;
      expect(op.method).toBe("GET");
      expect(op.path).toBe("/cfItems");
    });

    test("should expose getCFRubric operation", () => {
      const op = CaseV1_1.RestBinding.Operations.getCFRubric;
      expect(op.method).toBe("GET");
      expect(op.path).toContain("/cfRubrics/");
    });
  });

  describe("Shared validators", () => {
    test("should validate RFC4122 UUID", () => {
      const uuid = "3d8235b4-7f2c-4b8d-9e1a-2c5f3b6d7a8e";
      const result = CaseV1_1.Shared.Uuid.safeParse(uuid);
      expect(result.success).toBe(true);
    });

    test("should reject invalid UUID format", () => {
      const uuid = "not-a-uuid";
      const result = CaseV1_1.Shared.Uuid.safeParse(uuid);
      expect(result.success).toBe(false);
    });

    test("should validate ISO8601 datetime", () => {
      const dt = "2024-01-15T10:30:00Z";
      const result = CaseV1_1.Shared.DateTime.safeParse(dt);
      expect(result.success).toBe(true);
    });

    test("should validate link URI", () => {
      const uri = {
        title: "Item Resource",
        identifier: "3d8235b4-7f2c-4b8d-9e1a-2c5f3b6d7a8e",
        uri: "http://example.org/cf/items/1",
      };
      const result = CaseV1_1.Shared.LinkUri.safeParse(uri);
      expect(result.success).toBe(true);
    });
  });

  describe("Extensible vocabularies", () => {
    test("should allow standard association types", () => {
      const vocab = CaseV1_1.Shared.ExtensionEnum(["isChildOf", "isPartOf", "relatedTo"]);
      expect(vocab.safeParse("isChildOf").success).toBe(true);
    });

    test("should allow ext:* custom extensions", () => {
      const vocab = CaseV1_1.Shared.ExtensionEnum(["isChildOf"]);
      const customExt = "ext:custom-type";
      expect(vocab.safeParse(customExt).success).toBe(true);
    });

    test("should reject invalid ext: format", () => {
      const vocab = CaseV1_1.Shared.ExtensionEnum(["isChildOf"]);
      const invalidExt = "ext:";
      expect(vocab.safeParse(invalidExt).success).toBe(false);
    });
  });

  describe("Derived templates", () => {
    test("should expose spec links", () => {
      const { specLinks } = Case11DerivedZodTemplates;
      expect(specLinks.base).toContain("imsglobal.org/spec/case/v1p1");
      expect(specLinks.jsonSchema).toContain("purl.imsglobal.org");
      expect(specLinks.openApi).toContain("purl.imsglobal.org");
    });

    test("should document scope coverage", () => {
      const { scopes } = Case11DerivedZodTemplates;
      expect(scopes.jsonSchema).toContain("CFAssociation");
      expect(scopes.restBinding).toBeDefined();
    });
  });
});
