/**
 * Template content (templateInline/templateBlock) and rubricBlock rendering, plus the
 * capability-gate honesty rule for body node kinds the runtime cannot render: they are
 * reported as issues, never silently dropped (ADR-0003).
 */

import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { choiceInteraction } from "../src/interactions";
import { referenceSkin } from "../src/reference-skin";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";

const runtime = createQtiRuntime({ interactions: [choiceInteraction], skin: referenceSkin });

function templatedItem(showHide: "show" | "hide", identifier: string): AssessmentItemView {
  return {
    responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "identifier" }],
    templateDeclarations: [
      {
        identifier: "T",
        cardinality: "single",
        baseType: "identifier",
        defaultValue: { values: [{ value: "x" }] },
      },
    ],
    // Empty processing still runs, seeding template values from declared defaults.
    templateProcessing: { rules: [] },
    itemBody: {
      content: [
        {
          kind: "templateInline",
          templateIdentifier: "T",
          identifier,
          showHide,
          content: [{ kind: "text", value: "VARIANT" }],
        } as never,
        {
          kind: "templateBlock",
          templateIdentifier: "T",
          identifier,
          showHide,
          content: [{ kind: "xml", name: "p", value: "BLOCK" }],
        } as never,
      ],
    },
  };
}

describe("template content visibility", () => {
  test("show-mode template content renders when the template value matches", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: templatedItem("show", "x") }));

    expect(html).toContain("VARIANT");
    expect(html).toContain("BLOCK");
    expect(html).toContain('data-qti-template="x"');
  });

  test("show-mode template content stays hidden when the value does not match", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: templatedItem("show", "other") }));

    expect(html).not.toContain("VARIANT");
    expect(html).not.toContain("BLOCK");
  });

  test("hide-mode inverts: matched content is hidden", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: templatedItem("hide", "x") }));

    expect(html).not.toContain("VARIANT");
  });
});

describe("rubricBlock", () => {
  function rubricItem(view: string[]): AssessmentItemView {
    return {
      responseDeclarations: [],
      itemBody: {
        content: [
          {
            kind: "rubricBlock",
            view,
            content: [{ kind: "xml", name: "p", value: "Answer carefully." }],
          } as never,
        ],
      },
    };
  }

  test("candidate-view rubric content renders", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: rubricItem(["candidate"]) }));

    expect(html).toContain("Answer carefully.");
    expect(html).toContain("data-qti-rubric-block");
  });

  test("scorer-only rubric content does not render for candidates", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: rubricItem(["scorer"]) }));

    expect(html).not.toContain("Answer carefully.");
  });
});

describe("capability gate covers non-xml body kinds", () => {
  test("include nodes are reported, not silently dropped", () => {
    const report = runtime.canDeliver({
      responseDeclarations: [],
      itemBody: { content: [{ kind: "include", href: "fragment.xml" } as never] },
    });

    expect(report.deliverable).toBe(false);
    expect(report.issues).toEqual([{ type: "unsupported-element", name: "include" }]);
  });

  test("rubricBlock and template content are walked for nested issues", () => {
    const report = runtime.canDeliver({
      responseDeclarations: [],
      itemBody: {
        content: [
          {
            kind: "rubricBlock",
            view: ["candidate"],
            content: [{ kind: "xml", name: "iframe", value: "x" }],
          } as never,
          {
            kind: "templateInline",
            templateIdentifier: "T",
            identifier: "x",
            content: [{ kind: "canvasInteractionFutureKind", responseIdentifier: "R" }],
          } as never,
        ],
      },
    });

    expect(report.issues).toEqual([
      { type: "unsupported-element", name: "iframe" },
      { type: "unsupported-interaction", name: "canvasInteractionFutureKind", responseIdentifier: "R" },
    ]);
  });

  test("text and printedVariable nodes remain deliverable", () => {
    const report = runtime.canDeliver({
      responseDeclarations: [],
      itemBody: {
        content: [{ kind: "text", value: "hello" } as never, { kind: "printedVariable", identifier: "X" } as never],
      },
    });

    expect(report.issues).toEqual([]);
  });
});
