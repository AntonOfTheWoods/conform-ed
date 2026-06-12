/**
 * Shared stimulus (qti-assessment-stimulus-ref, §7.6): items reference an external
 * AssessmentStimulus document; the consumer resolves it (packages load before
 * mounting, like the session store's resolveItem) and the runtime renders the
 * stimulus body through the same sanitized content walk as the item body.
 */

import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { qtiCoreInteractions } from "../src/interactions";
import { stimulusContentFromNormalized } from "../src/normalized-item";
import { referenceSkin } from "../src/reference-skin";
import { createQtiRuntime, type AssessmentItemView, type StimulusContentView } from "../src/runtime";

const item: AssessmentItemView = {
  responseDeclarations: [
    {
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: { values: [{ value: "A" }] },
    },
  ],
  outcomeDeclarations: [],
  assessmentStimulusRefs: [{ identifier: "STIM-1", href: "shared/passage.xml" }],
  itemBody: {
    content: [
      {
        kind: "choiceInteraction",
        responseIdentifier: "RESPONSE",
        maxChoices: 1,
        simpleChoices: [{ identifier: "A" }],
      },
    ],
  },
};

const passage: StimulusContentView = {
  content: [{ kind: "xml", name: "p", children: [{ kind: "text", value: "Read this carefully." }] }] as never,
};

describe("shared stimulus (assessmentStimulusRef)", () => {
  test("unresolved refs are a capability issue, never a silent drop", () => {
    const runtime = createQtiRuntime({ interactions: qtiCoreInteractions, skin: referenceSkin });
    const report = runtime.canDeliver(item);

    expect(report.deliverable).toBe(false);
    expect(report.issues[0]).toMatchObject({
      type: "unsupported-element",
      name: "assessmentStimulusRef",
      detail: "shared/passage.xml",
    });
  });

  test("a resolver makes the item deliverable and renders the stimulus before the body", () => {
    const runtime = createQtiRuntime({
      interactions: qtiCoreInteractions,
      skin: referenceSkin,
      resolveStimulus: () => passage,
    });

    expect(runtime.canDeliver(item).issues).toEqual([]);

    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item }));

    expect(html).toContain('data-qti-stimulus="STIM-1"');
    expect(html).toContain("Read this carefully.");
    expect(html.indexOf("Read this carefully.")).toBeLessThan(html.indexOf("data-qti-interaction"));
  });

  test("resolved stimulus content passes through the content-model gate", () => {
    const runtime = createQtiRuntime({
      interactions: qtiCoreInteractions,
      skin: referenceSkin,
      resolveStimulus: () => ({ content: [{ kind: "xml", name: "marquee", children: [] }] }) as never,
    });

    expect(runtime.canDeliver(item).issues[0]).toMatchObject({ type: "unsupported-element", name: "marquee" });
  });

  test("rendering without a resolver shows the explicit placeholder (ADR-0003 backstop)", () => {
    const runtime = createQtiRuntime({ interactions: qtiCoreInteractions, skin: referenceSkin });
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item }));

    expect(html).toContain('data-qti-unsupported="assessmentStimulusRef"');
  });

  test("stimulusContentFromNormalized reshapes a normalized stimulus document", () => {
    const view = stimulusContentFromNormalized({
      assessmentStimulus: {
        identifier: "STIM-1",
        title: "The passage",
        stimulusBody: { content: ["Read this carefully."] },
      },
    });

    expect(view?.content).toEqual([{ kind: "text", value: "Read this carefully." }]);
    expect(stimulusContentFromNormalized({ assessmentItem: {} })).toBeNull();
  });
});
