import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { choiceInteraction } from "../src/interactions";
import { referenceSkin } from "../src/reference-skin";
import type { ResponseProcessingView } from "../src/rp";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";
import { createAttemptStore } from "../src/store";

const feedbackRp: ResponseProcessingView = {
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
            expression: { kind: "baseValue", baseType: "float", value: 1 },
          },
          {
            kind: "setOutcomeValue",
            identifier: "FEEDBACK",
            expression: { kind: "baseValue", baseType: "identifier", value: "CORRECT" },
          },
        ],
      },
      responseElse: {
        rules: [
          {
            kind: "setOutcomeValue",
            identifier: "FEEDBACK",
            expression: { kind: "baseValue", baseType: "identifier", value: "INCORRECT" },
          },
        ],
      },
    },
  ],
};

const item: AssessmentItemView = {
  responseDeclarations: [
    {
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: { values: [{ value: "B" }] },
    },
  ],
  outcomeDeclarations: [
    { identifier: "SCORE", cardinality: "single", baseType: "float" },
    { identifier: "FEEDBACK", cardinality: "single", baseType: "identifier" },
  ],
  responseProcessing: feedbackRp,
  modalFeedbacks: [
    {
      outcomeIdentifier: "FEEDBACK",
      identifier: "CORRECT",
      showHide: "show",
      content: [{ kind: "xml", name: "p", value: "Well done!" }],
    },
  ],
  itemBody: {
    content: [
      {
        kind: "choiceInteraction",
        responseIdentifier: "RESPONSE",
        simpleChoices: [{ identifier: "A" }, { identifier: "B" }],
      },
      {
        kind: "feedbackBlock",
        outcomeIdentifier: "FEEDBACK",
        identifier: "CORRECT",
        showHide: "show",
        content: [{ kind: "xml", name: "p", value: "That is the right answer." }],
      },
      {
        kind: "feedbackInline",
        outcomeIdentifier: "FEEDBACK",
        identifier: "CORRECT",
        showHide: "hide",
        content: [{ kind: "text", value: "Try again next time." }],
      },
    ],
  },
};

const runtime = createQtiRuntime({ interactions: [choiceInteraction], skin: referenceSkin });

function storeFor(response: string | null, submit: boolean) {
  const store = createAttemptStore(
    item.responseDeclarations,
    {},
    {
      outcomeDeclarations: item.outcomeDeclarations,
      responseProcessing: item.responseProcessing,
    },
  );

  if (response !== null) {
    store.setResponse("RESPONSE", response);
  }

  if (submit) {
    store.submit();
  }

  return store;
}

describe("attempt store outcomes", () => {
  test("submit runs the RP interpreter and exposes outcomes in the snapshot", () => {
    const store = storeFor("B", true);

    expect(store.getSnapshot().outcomes["SCORE"]).toBe(1);
    expect(store.getSnapshot().outcomes["FEEDBACK"]).toBe("CORRECT");
  });

  test("only the maintained built-in exists before submit, and reset restores it", () => {
    const store = storeFor("B", false);

    // completionStatus is "declared implicitly" and maintained by the engine
    // (§2.2.2.3); no authored outcome exists until submit.
    expect(store.getSnapshot().outcomes).toEqual({ completionStatus: "unknown" });

    store.submit();
    store.reset();
    expect(store.getSnapshot().outcomes).toEqual({ completionStatus: "unknown" });
  });

  test("items without responseProcessing produce only the maintained built-in", () => {
    const bare = createAttemptStore(item.responseDeclarations, {});

    bare.setResponse("RESPONSE", "B");
    bare.submit();
    expect(bare.getSnapshot().outcomes).toEqual({ completionStatus: "unknown" });
  });
});

describe("feedback rendering", () => {
  test("before submit, no feedback is visible", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item, store: storeFor(null, false) }));

    expect(html).not.toContain("That is the right answer.");
    expect(html).not.toContain("Try again next time.");
    expect(html).not.toContain("Well done!");
  });

  test("after a correct submit: show-feedback and modal visible, hide-feedback hidden", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item, store: storeFor("B", true) }));

    expect(html).toContain("That is the right answer.");
    expect(html).toContain("Well done!");
    expect(html).not.toContain("Try again next time.");
    expect(html).toContain('data-qti-feedback="CORRECT"');
    expect(html).toContain("data-qti-modal-feedback");
  });

  test("after a wrong submit: hide-feedback visible, show-feedback and modal hidden", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item, store: storeFor("A", true) }));

    expect(html).not.toContain("That is the right answer.");
    expect(html).not.toContain("Well done!");
    expect(html).toContain("Try again next time.");
  });
});

describe("canDeliver covers response processing (ADR-0003/0004)", () => {
  test("supported RP and feedback raise no issues", () => {
    expect(runtime.canDeliver(item).deliverable).toBe(true);
  });

  test("unsupported RP operators are reported", () => {
    const report = runtime.canDeliver({
      ...item,
      responseProcessing: {
        rules: [
          {
            kind: "setOutcomeValue",
            identifier: "SCORE",
            expression: { kind: "customOperator", expressions: [] },
          },
        ],
      },
    });

    expect(report.deliverable).toBe(false);
    expect(report.issues[0]).toEqual({ type: "unsupported-rp", name: "customOperator" });
  });

  test("non-allowlisted elements inside feedback content are reported", () => {
    const report = runtime.canDeliver({
      ...item,
      itemBody: {
        content: [
          {
            kind: "feedbackBlock",
            outcomeIdentifier: "FEEDBACK",
            identifier: "CORRECT",
            showHide: "show",
            content: [{ kind: "xml", name: "iframe", value: "x" }],
          },
        ],
      },
    });

    expect(report.issues).toContainEqual({ type: "unsupported-element", name: "iframe" });
  });
});
