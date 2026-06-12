/**
 * MathML: the content model allowlists the `math` root and renders the presentation
 * subtree structurally — element names inside math are not individually allowlisted,
 * but attribute hardening (no event handlers, no javascript: URLs) still applies.
 */

import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { referenceSkin } from "../src/reference-skin";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";

const runtime = createQtiRuntime({ interactions: [], skin: referenceSkin });

function mathItem(): AssessmentItemView {
  return {
    responseDeclarations: [],
    itemBody: {
      content: [
        {
          kind: "xml",
          name: "math",
          children: [
            {
              kind: "xml",
              name: "mrow",
              children: [
                { kind: "xml", name: "mi", attributes: { mathvariant: "bold", onclick: "steal()" }, value: "x" },
                { kind: "xml", name: "mo", value: "+" },
                { kind: "xml", name: "mn", value: "1" },
              ],
            },
          ],
        },
      ],
    },
  };
}

describe("MathML subtree", () => {
  test("presentation elements inside math render structurally", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: mathItem() }));

    expect(html).toContain("<math>");
    expect(html).toContain("<mrow>");
    expect(html).toContain(">x</mi>");
    expect(html).toContain(">+</mo>");
    expect(html).toContain(">1</mn>");
  });

  test("math attributes survive hardening, event handlers do not", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item: mathItem() }));

    expect(html).toContain('mathvariant="bold"');
    expect(html).not.toContain("onclick");
  });

  test("the capability gate does not flag MathML element names", () => {
    const report = runtime.canDeliver(mathItem());

    expect(report.issues).toEqual([]);
  });

  test("mi outside a math root is still rejected by the allowlist", () => {
    const report = runtime.canDeliver({
      responseDeclarations: [],
      itemBody: { content: [{ kind: "xml", name: "mi", value: "x" }] },
    });

    expect(report.issues).toEqual([{ type: "unsupported-element", name: "mi" }]);
  });
});
