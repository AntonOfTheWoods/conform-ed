import { expect, test } from "bun:test";

import { QtiV2_2 } from "../src";

test("QtiV2_2 metadata document parses a minimal metadata payload with scoring modes", () => {
  const parsed = QtiV2_2.QtiMetadataDocumentSchema.safeParse({
    qtiMetadata: {
      itemTemplate: false,
      interactionType: ["choiceInteraction", "mediaInteraction"],
      scoringMode: ["responseprocessing"],
      toolName: "conform-ed",
    },
  });

  expect(parsed.success).toBe(true);
});

test("QtiV2_2 assessment stimulus and assessment item documents parse together", () => {
  const stimulusParsed = QtiV2_2.QtiAssessmentStimulusDocumentSchema.safeParse({
    assessmentStimulus: {
      identifier: "STIM1",
      stimulusBody: {
        children: [
          {
            kind: "article",
            children: [{ kind: "text", value: "Shared stimulus" }],
          },
        ],
      },
    },
  });

  const itemParsed = QtiV2_2.QtiAssessmentItemDocumentSchema.safeParse({
    assessmentItem: {
      identifier: "ITEM1",
      assessmentStimulusRefs: [{ href: "stimulus.xml", identifier: "STIM1" }],
      responseDeclarations: [
        {
          identifier: "RESPONSE",
          cardinality: "single",
          baseType: "identifier",
        },
      ],
      itemBody: {
        children: [
          {
            kind: "choiceInteraction",
            responseIdentifier: "RESPONSE",
            simpleChoices: [
              { kind: "simpleChoice", identifier: "A", children: [{ kind: "text", value: "A" }] },
              { kind: "simpleChoice", identifier: "B", children: [{ kind: "text", value: "B" }] },
            ],
          },
        ],
      },
    },
  });

  expect(stimulusParsed.success).toBe(true);
  expect(itemParsed.success).toBe(true);
});

test("QtiV2_2 processing rejects invalid numeric operator parameters", () => {
  const parsed = QtiV2_2.QtiResponseProcessingDocumentSchema.safeParse({
    responseProcessing: {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "RANDOM",
          expression: {
            kind: "randomInteger",
            min: 10,
            max: 1,
          },
        },
      ],
    },
  });

  expect(parsed.success).toBe(false);
});

test("QtiV2_2 curriculum standards metadata and manifest documents parse", () => {
  const csmParsed = QtiV2_2.QtiCurriculumStandardsMetadataSetDocumentSchema.safeParse({
    curriculumStandardsMetadataSet: {
      resourceLabel: "Item",
      curriculumStandardsMetadata: [
        {
          providerId: "provider-1",
          setOfGuids: [
            {
              region: "AU",
              labelledGuids: [{ guid: "GUID-1", label: "Outcome 1" }],
            },
          ],
        },
      ],
    },
  });

  const manifestParsed = QtiV2_2.QtiManifestDocumentSchema.safeParse({
    manifest: {
      identifier: "manifest-2",
      metadata: {
        schema: "QTIv2.2 Package",
        schemaVersion: "1.0.0",
        curriculumStandardsMetadataSet: {
          curriculumStandardsMetadata: [
            {
              setOfGuids: [
                {
                  labelledGuids: [{ guid: "GUID-1" }],
                },
              ],
            },
          ],
        },
      },
      organizations: {},
      resources: [
        {
          identifier: "stimulus-resource",
          type: "imsqti_stimulus_xmlv2p2",
          href: "stimulus.xml",
          files: [{ href: "stimulus.xml" }],
        },
      ],
    },
  });

  expect(csmParsed.success).toBe(true);
  expect(manifestParsed.success).toBe(true);
});

test("QtiV2_2 APIP accessibility document parses external supplemental accessibility", () => {
  const parsed = QtiV2_2.QtiApipAccessibilityDocumentSchema.safeParse({
    apipAccessibility: {
      externalSupplementalAccessibility: {
        fileHrefs: [{ href: "supplement.xml" }],
      },
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
