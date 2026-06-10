import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { choiceInteraction } from "../src/interactions";
import { createQtiRuntime, type AssessmentItemView, type InteractionRenderProps } from "../src/runtime";

function ChoiceTestSkin(props: InteractionRenderProps): ReturnType<typeof createElement> {
  const choices = props.node.simpleChoices as ReadonlyArray<{ identifier: string }>;

  return createElement(
    "ul",
    { "data-rid": props.responseIdentifier },
    choices.map((choice) => {
      const optionProps = props.getOptionProps(choice.identifier);

      return createElement(
        "li",
        { key: choice.identifier, role: optionProps.role, "data-status": optionProps["data-status"] },
        choice.identifier,
      );
    }),
  );
}

const item: AssessmentItemView = {
  responseDeclarations: [
    {
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: { values: [{ value: "B" }] },
    },
  ],
  itemBody: {
    content: [
      { kind: "xml", name: "p", children: [{ kind: "xml", name: "span", value: "Pick one" }] },
      { kind: "xml", name: "script", value: "alert(1)", attributes: { onclick: "x()" } },
      {
        kind: "choiceInteraction",
        responseIdentifier: "RESPONSE",
        simpleChoices: [{ identifier: "A" }, { identifier: "B" }],
      },
    ],
  },
};

describe("createQtiRuntime body walk + registry dispatch", () => {
  const { ItemRenderer } = createQtiRuntime({
    interactions: [choiceInteraction],
    skin: { choiceInteraction: ChoiceTestSkin },
  });

  const html = renderToStaticMarkup(createElement(ItemRenderer, { item }));

  test("renders allowlisted flow content", () => {
    expect(html).toContain("Pick one");
    expect(html).toContain("<p>");
  });

  test("drops non-allowlisted elements (script) entirely", () => {
    expect(html).not.toContain("script");
    expect(html).not.toContain("alert(1)");
  });

  test("dispatches interaction nodes to the registered skin with prop-getter wiring", () => {
    expect(html).toContain('data-rid="RESPONSE"');
    expect(html).toContain('role="radio"');
    expect(html).toContain('data-status="idle"');
  });

  test("renders children inside the runtime context, after the item body", () => {
    const footer = createElement("footer", { "data-testid": "attempt-footer" }, "Submit");
    const withFooter = renderToStaticMarkup(createElement(ItemRenderer, { item }, footer));

    expect(withFooter).toContain('data-testid="attempt-footer"');
    // Children render after the body: the footer appears past the interaction markup.
    expect(withFooter.indexOf("attempt-footer")).toBeGreaterThan(withFooter.indexOf("data-rid"));
  });
});
