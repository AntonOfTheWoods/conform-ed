import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { qtiCoreInteractions } from "../src/interactions";
import { referenceSkin } from "../src/reference-skin";
import type { ResponseProcessingView } from "../src/rp";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";
import { createAttemptStore } from "../src/store";

const runtime = createQtiRuntime({ interactions: qtiCoreInteractions, skin: referenceSkin });

// Adaptive RP: a correct answer completes; a hint request reveals feedback and
// deducts a point; anything else marks the attempt incomplete.
const adaptiveRp: ResponseProcessingView = {
  rules: [
    {
      kind: "responseCondition",
      responseIf: {
        expression: {
          kind: "match",
          expressions: [
            { kind: "variable", identifier: "RESPONSE" },
            { kind: "correct", identifier: "RESPONSE" },
          ],
        },
        rules: [
          {
            kind: "setOutcomeValue",
            identifier: "SCORE",
            expression: {
              kind: "sum",
              expressions: [
                { kind: "variable", identifier: "SCORE" },
                { kind: "baseValue", baseType: "float", value: 2 },
              ],
            },
          },
          {
            kind: "setOutcomeValue",
            identifier: "completionStatus",
            expression: { kind: "baseValue", baseType: "identifier", value: "completed" },
          },
        ],
      },
      responseElseIfs: [
        {
          expression: {
            kind: "match",
            expressions: [
              { kind: "variable", identifier: "HINT" },
              { kind: "baseValue", baseType: "boolean", value: true },
            ],
          },
          rules: [
            {
              kind: "setOutcomeValue",
              identifier: "SCORE",
              expression: {
                kind: "subtract",
                expressions: [
                  { kind: "variable", identifier: "SCORE" },
                  { kind: "baseValue", baseType: "float", value: 1 },
                ],
              },
            },
            {
              kind: "setOutcomeValue",
              identifier: "FEEDBACK",
              expression: { kind: "baseValue", baseType: "identifier", value: "HINT" },
            },
            {
              kind: "setOutcomeValue",
              identifier: "completionStatus",
              expression: { kind: "baseValue", baseType: "identifier", value: "incomplete" },
            },
          ],
        },
      ],
      responseElse: {
        rules: [
          {
            kind: "setOutcomeValue",
            identifier: "completionStatus",
            expression: { kind: "baseValue", baseType: "identifier", value: "incomplete" },
          },
        ],
      },
    },
  ],
};

const item: AssessmentItemView = {
  adaptive: true,
  responseDeclarations: [
    {
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: { values: [{ value: "B" }] },
    },
    { identifier: "HINT", cardinality: "single", baseType: "boolean" },
  ],
  outcomeDeclarations: [
    { identifier: "SCORE", cardinality: "single", baseType: "float" },
    { identifier: "FEEDBACK", cardinality: "single", baseType: "identifier" },
  ],
  responseProcessing: adaptiveRp,
  itemBody: {
    content: [
      {
        kind: "choiceInteraction",
        responseIdentifier: "RESPONSE",
        simpleChoices: [{ identifier: "A" }, { identifier: "B" }],
      },
      {
        kind: "feedbackInline",
        outcomeIdentifier: "FEEDBACK",
        identifier: "HINT",
        showHide: "show",
        content: [{ kind: "text", value: "It is the second one." }],
      },
      { kind: "endAttemptInteraction", responseIdentifier: "HINT", title: "Show hint" },
    ],
  },
};

function adaptiveStore() {
  return createAttemptStore(
    item.responseDeclarations,
    {},
    {
      outcomeDeclarations: item.outcomeDeclarations,
      responseProcessing: item.responseProcessing,
      adaptive: true,
    },
  );
}

describe("adaptive item attempts", () => {
  test("an incomplete attempt does not lock the item and counts attempts", () => {
    const store = adaptiveStore();

    store.setResponse("RESPONSE", "A");
    store.submit();

    const snapshot = store.getSnapshot();

    expect(snapshot.submitted).toBe(false);
    expect(snapshot.attemptCount).toBe(1);
    expect(snapshot.outcomes["completionStatus"]).toBe("incomplete");
  });

  test("outcomes carry over between attempts (hint penalty then completion)", () => {
    const store = adaptiveStore();

    store.setResponse("HINT", "true");
    store.submit();

    expect(store.getSnapshot().outcomes["SCORE"]).toBe(-1);
    expect(store.getSnapshot().outcomes["FEEDBACK"]).toBe("HINT");
    expect(store.getSnapshot().submitted).toBe(false);

    // endAttempt-style boolean responses reset between attempts
    expect(store.getSnapshot().responses["HINT"] ?? null).toBeNull();

    store.setResponse("RESPONSE", "B");
    store.submit();

    const snapshot = store.getSnapshot();

    expect(snapshot.outcomes["SCORE"]).toBe(1); // -1 carried over, +2 on completion
    expect(snapshot.outcomes["completionStatus"]).toBe("completed");
    expect(snapshot.submitted).toBe(true);
    expect(snapshot.attemptCount).toBe(2);
  });

  test("non-adaptive items keep single-attempt semantics", () => {
    const store = createAttemptStore(
      item.responseDeclarations,
      {},
      {
        outcomeDeclarations: item.outcomeDeclarations,
        responseProcessing: item.responseProcessing,
      },
    );

    store.setResponse("RESPONSE", "A");
    store.submit();

    expect(store.getSnapshot().submitted).toBe(true);
  });
});

describe("endAttemptInteraction", () => {
  test("ships a descriptor and renders a titled button", () => {
    expect(runtime.canDeliver(item).deliverable).toBe(true);

    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item }));

    expect(html).toContain(">Show hint</button>");
    expect(html).toContain('data-qti-interaction="endAttemptInteraction"');
  });
});

describe("printedVariable", () => {
  test("renders template values into the body", () => {
    const templated: AssessmentItemView = {
      responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "integer" }],
      templateDeclarations: [
        { identifier: "A", cardinality: "single", baseType: "integer" },
        { identifier: "B", cardinality: "single", baseType: "integer" },
      ],
      templateProcessing: {
        rules: [
          { kind: "setTemplateValue", identifier: "A", expression: { kind: "randomInteger", min: 2, max: 2 } },
          { kind: "setTemplateValue", identifier: "B", expression: { kind: "randomInteger", min: 5, max: 5 } },
        ],
      },
      itemBody: {
        content: [
          {
            kind: "xml",
            name: "p",
            children: [
              { kind: "text", value: "What is " },
              { kind: "printedVariable", identifier: "A" },
              { kind: "text", value: " + " },
              { kind: "printedVariable", identifier: "B" },
              { kind: "text", value: "?" },
            ],
          },
          { kind: "textEntryInteraction", responseIdentifier: "RESPONSE" },
        ],
      },
    };

    expect(runtime.canDeliver(templated).deliverable).toBe(true);

    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: templated }));

    expect(html).toContain("What is ");
    expect(html).toContain(">2</span>");
    expect(html).toContain(">5</span>");
  });
});
