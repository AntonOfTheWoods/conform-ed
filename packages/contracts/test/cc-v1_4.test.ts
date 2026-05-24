import { expect, test } from "bun:test";

import { CommonCartridgeV1_4 } from "../src";

test("CommonCartridgeV1_4 parses a minimal core manifest", () => {
  const parsed = CommonCartridgeV1_4.CommonCartridgeManifestProfileDocumentSchema.safeParse({
    manifest: {
      identifier: "MANIFEST1",
      metadata: {
        schema: "IMS Common Cartridge",
        schemaversion: "1.4.0",
        lom: {},
      },
      organizations: {
        organization: {
          identifier: "ORG1",
          structure: "rooted-hierarchy",
          item: {
            identifier: "ROOT",
          },
        },
      },
      resources: {
        resource: [
          {
            identifier: "RES1",
            type: "webcontent",
            href: "index.html",
            file: [{ href: "index.html" }],
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("CommonCartridgeV1_4 rejects question-bank references from organization items", () => {
  const parsed = CommonCartridgeV1_4.CommonCartridgeManifestProfileDocumentSchema.safeParse({
    manifest: {
      identifier: "MANIFEST1",
      metadata: {
        schema: "IMS Common Cartridge",
        schemaversion: "1.4.0",
        lom: {},
      },
      organizations: {
        organization: {
          identifier: "ORG1",
          structure: "rooted-hierarchy",
          item: {
            identifier: "ROOT",
            item: [
              {
                identifier: "ITEM1",
                identifierref: "QB1",
                title: "Linked question bank",
              },
            ],
          },
        },
      },
      resources: {
        resource: [
          {
            identifier: "QB1",
            type: "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
            file: [{ href: "bank.xml" }],
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(false);
});

test("CommonCartridgeV1_4 parses a minimal thin manifest with embedded webLink XML", () => {
  const parsed = CommonCartridgeV1_4.ThinCommonCartridgeManifestProfileDocumentSchema.safeParse({
    manifest: {
      identifier: "THIN1",
      metadata: {
        schema: "IMS Thin Common Cartridge",
        schemaversion: "1.4.0",
        lom: {},
      },
      organizations: {
        organization: {
          identifier: "ORG1",
          structure: "rooted-hierarchy",
          item: {
            identifier: "ROOT",
          },
        },
      },
      resources: {
        resource: [
          {
            identifier: "LINK1",
            type: "imswl_xmlv1p4",
            webLink: {
              title: "External reading",
              url: {
                href: "https://example.test/resource",
              },
            },
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("CommonCartridgeV1_4 thin profile rejects mismatched embedded resource XML", () => {
  const parsed = CommonCartridgeV1_4.ThinCommonCartridgeManifestProfileDocumentSchema.safeParse({
    manifest: {
      identifier: "THIN1",
      metadata: {
        schema: "IMS Thin Common Cartridge",
        schemaversion: "1.4.0",
        lom: {},
      },
      organizations: {
        organization: {
          identifier: "ORG1",
          structure: "rooted-hierarchy",
          item: {
            identifier: "ROOT",
          },
        },
      },
      resources: {
        resource: [
          {
            identifier: "LINK1",
            type: "imswl_xmlv1p4",
            cartridge_basiclti_link: {
              title: "Tool",
              vendor: {
                code: "tool-vendor",
                name: { value: "Tool Vendor" },
              },
            },
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(false);
});

test("CommonCartridgeV1_4 K-12 LOM resource profile enforces required educational metadata", () => {
  const parsed = CommonCartridgeV1_4.K12LomResourceDocumentSchema.safeParse({
    lom: {
      general: {
        title: {
          string: [{ value: "Algebra lesson" }],
        },
      },
      educational: [
        {
          intendedEndUserRole: [{ value: "learner" }],
        },
      ],
    },
  });

  expect(parsed.success).toBe(false);
});

test("CommonCartridgeV1_4 parses assignment, line item, accessibility, and open video documents", () => {
  const assignment = CommonCartridgeV1_4.AssignmentDocumentSchema.safeParse({
    assignment: {
      identifier: "ASSIGN1",
      title: "Essay",
      text: {
        value: "Write a short essay.",
        texttype: "text/plain",
      },
    },
  });

  const lineItem = CommonCartridgeV1_4.LineItemDocumentSchema.safeParse({
    lineItem: {
      scoreMaximum: 100,
      label: "Homework 1",
    },
  });

  const accessibility = CommonCartridgeV1_4.ResourceAccessibilityMetadataDocumentSchema.safeParse({
    ResourceAccessibilityMetadata: {
      accessibilityFeature: ["captions"],
      accessMode: ["visual"],
    },
  });

  const openVideo = CommonCartridgeV1_4.OpenVideoSessionDocumentSchema.safeParse({
    session: {
      title: "Lecture capture",
      streams: {
        stream: [
          {
            startTime: "PT0S",
            file: {
              url: "https://example.test/video.mp4",
              mimeType: "video/mp4",
            },
            source: "presenter",
            providesAudio: true,
          },
        ],
      },
    },
  });

  expect(assignment.success).toBe(true);
  expect(lineItem.success).toBe(true);
  expect(accessibility.success).toBe(true);
  expect(openVideo.success).toBe(true);
});

test("CommonCartridgeV1_4 exposes expected derived templates", () => {
  expect(CommonCartridgeV1_4.CommonCartridgeDerivedZodTemplates.commonCartridgeManifestProfileDocument).toBe(
    CommonCartridgeV1_4.CommonCartridgeManifestProfileDocumentSchema,
  );
  expect(CommonCartridgeV1_4.CommonCartridgeDerivedZodTemplates.thinCommonCartridgeManifestProfileDocument).toBe(
    CommonCartridgeV1_4.ThinCommonCartridgeManifestProfileDocumentSchema,
  );
  expect(CommonCartridgeV1_4.CommonCartridgeDerivedZodTemplates.k12CommonCartridgeManifestProfileDocument).toBe(
    CommonCartridgeV1_4.K12CommonCartridgeManifestProfileDocumentSchema,
  );
  expect(CommonCartridgeV1_4.CommonCartridgeDerivedZodTemplates.assignmentDocument).toBe(
    CommonCartridgeV1_4.AssignmentDocumentSchema,
  );
});
