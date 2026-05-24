import { expect, test } from "bun:test";

import { QtiV2_1 } from "../src";

test("QtiV2_1 metadata document parses a minimal metadata payload", () => {
  const parsed = QtiV2_1.QtiMetadataDocumentSchema.safeParse({
    qtiMetadata: {
      itemTemplate: false,
      interactionType: ["choiceInteraction"],
      feedbackType: "nonadaptive",
      solutionAvailable: true,
    },
  });

  expect(parsed.success).toBe(true);
});

test("QtiV2_1 assessment item document parses a minimal choice item", () => {
  const parsed = QtiV2_1.QtiAssessmentItemDocumentSchema.safeParse({
    assessmentItem: {
      identifier: "ITEM1",
      responseDeclarations: [
        {
          identifier: "RESPONSE",
          cardinality: "single",
          baseType: "identifier",
          correctResponse: {
            values: [{ value: "A" }],
          },
        },
      ],
      outcomeDeclarations: [
        {
          identifier: "SCORE",
          cardinality: "single",
          baseType: "float",
          defaultValue: {
            values: [{ value: "0" }],
          },
        },
      ],
      itemBody: {
        children: [
          {
            kind: "choiceInteraction",
            responseIdentifier: "RESPONSE",
            simpleChoices: [
              {
                kind: "simpleChoice",
                identifier: "A",
                children: [{ kind: "text", value: "Option A" }],
              },
              {
                kind: "simpleChoice",
                identifier: "B",
                children: [{ kind: "text", value: "Option B" }],
              },
            ],
          },
        ],
      },
      responseProcessing: {
        rules: [
          {
            kind: "setOutcomeValue",
            identifier: "SCORE",
            expression: {
              kind: "baseValue",
              baseType: "float",
              value: "1.0",
            },
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(true);
});

test("QtiV2_1 result document rejects record responses without field identifiers", () => {
  const parsed = QtiV2_1.QtiAssessmentResultDocumentSchema.safeParse({
    assessmentResult: {
      context: {},
      itemResults: [
        {
          identifier: "ITEM1",
          datestamp: "2026-05-27T12:00:00Z",
          sessionStatus: "final",
          responseVariables: [
            {
              identifier: "RESPONSE",
              cardinality: "record",
              candidateResponse: {
                values: [{ value: "A" }],
              },
            },
          ],
        },
      ],
    },
  });

  expect(parsed.success).toBe(false);
});

test("QtiV2_1 manifest document parses a minimal package", () => {
  const parsed = QtiV2_1.QtiManifestDocumentSchema.safeParse({
    manifest: {
      identifier: "manifest-1",
      metadata: {
        schema: "QTIv2.1 Package",
        schemaVersion: "1.0.0",
      },
      organizations: {},
      resources: [
        {
          identifier: "item-resource",
          type: "imsqti_item_xmlv2p1",
          href: "items/item1.xml",
          files: [{ href: "items/item1.xml" }],
        },
      ],
    },
  });

  expect(parsed.success).toBe(true);
});

test("QtiV2_1 APIP accessibility document parses a minimal payload", () => {
  const parsed = QtiV2_1.QtiApipAccessibilityDocumentSchema.safeParse({
    apipAccessibility: {
      accessibilityInfo: {
        accessElements: [
          {
            identifier: "ae1",
            contentLinkInfos: [{ qtiLinkIdentifier: "choice-A" }],
            relatedElementInfo: {},
          },
        ],
      },
    },
  });

  expect(parsed.success).toBe(true);
});
