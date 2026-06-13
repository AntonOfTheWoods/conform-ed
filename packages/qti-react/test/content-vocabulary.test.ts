/**
 * The full QTI HTML vocabulary (HTMLContentDType in the official ASI XSD) renders:
 * anchors, definition lists, pre, details, bdo/bdi (§2.14.1 bidirectional text),
 * and the rest of the enumerated subset. WAI-ARIA characteristics (§2.13.3) and
 * data-* extension attributes pass the sanitizer per the XSD's own attribute
 * schematron; scripting surfaces stay stripped. SSML annotations (§2.13.2) are
 * aural: the annotated text renders transparently, never as a misread HTML element.
 */

import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { qtiCoreInteractions } from "../src/interactions";
import { referenceSkin } from "../src/reference-skin";
import { createQtiRuntime, type BodyNode } from "../src/runtime";

const { ContentRenderer } = createQtiRuntime({
  interactions: qtiCoreInteractions,
  skin: referenceSkin,
  assetResolver: (href) => (href.startsWith("http") ? href : `/pkg/${href}`),
});

function render(nodes: BodyNode[]): string {
  return renderToStaticMarkup(createElement(ContentRenderer, { nodes }));
}

const xml = (name: string, attributes: Record<string, string> | undefined, ...children: BodyNode[]): BodyNode =>
  ({ kind: "xml", name, ...(attributes ? { attributes } : {}), children }) as BodyNode;
const text = (value: string): BodyNode => ({ kind: "text", value }) as BodyNode;

describe("the QTI HTML vocabulary", () => {
  test("definition lists, pre, details, and anchors render", () => {
    const html = render([
      xml("dl", undefined, xml("dt", undefined, text("term")), xml("dd", undefined, text("definition"))),
      xml("pre", undefined, text("verbatim")),
      xml("details", undefined, xml("summary", undefined, text("More")), text("Hidden details")),
      xml("a", { href: "materials/help.html", type: "text/html" }, text("Help")),
    ]);

    expect(html).toContain("<dl><dt>term</dt><dd>definition</dd></dl>");
    expect(html).toContain("<pre>verbatim</pre>");
    expect(html).toContain("<summary>More</summary>");
    expect(html).toContain('href="/pkg/materials/help.html"');
    expect(html).toContain('type="text/html"');
  });

  test("bidirectional text (§2.14.1) and the small inline vocabulary render", () => {
    const html = render([
      xml("bdo", { dir: "rtl" }, text("שלום")),
      xml("bdi", undefined, text("user-input")),
      xml("q", undefined, text("quoted")),
      xml("kbd", undefined, text("Ctrl")),
      xml("samp", undefined, text("output")),
      xml("var", undefined, text("x")),
      xml("abbr", undefined, text("QTI")),
      xml("code", undefined, text("f()")),
    ]);

    expect(html).toContain('<bdo dir="rtl">שלום</bdo>');
    expect(html).toContain("<bdi>user-input</bdi>");
    expect(html).toContain("<q>quoted</q>");
    expect(html).toContain("<kbd>Ctrl</kbd>");
    expect(html).toContain("<samp>output</samp>");
    expect(html).toContain("<var>x</var>");
    expect(html).toContain("<abbr>QTI</abbr>");
    expect(html).toContain("<code>f()</code>");
  });

  test("WAI-ARIA characteristics and data-* extensions pass the sanitizer (§2.13.3)", () => {
    const html = render([
      xml(
        "div",
        {
          role: "note",
          "aria-label": "Important",
          "aria-live": "polite",
          "data-custom": "yes",
          "data-qti-suppress-tts": "all",
          onclick: "alert(1)",
        },
        text("annotated"),
      ),
    ]);

    expect(html).toContain('role="note"');
    expect(html).toContain('aria-label="Important"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-custom="yes"');
    expect(html).toContain('data-qti-suppress-tts="all"');
    expect(html).not.toContain("onclick");
  });

  test("SSML annotations render their text transparently (§2.13.2)", () => {
    const ssml = "http://www.w3.org/2001/10/synthesis";
    const html = render([
      xml(
        "p",
        undefined,
        text("Why did "),
        {
          kind: "xml",
          namespace: ssml,
          name: "sub",
          attributes: { alias: "A-nina" },
          children: [text("Anina")],
        } as BodyNode,
        text(" call?"),
      ),
      { kind: "xml", namespace: ssml, name: "break", attributes: { time: "300ms" } } as BodyNode,
      xml("p", undefined, xml("sub", undefined, text("2"))),
    ]);

    // The SSML alias is aural; visually the text passes through with no <sub>.
    expect(html).toContain("Why did Anina call?");
    expect(html).not.toContain("<sub>Anina</sub>");
    // Real HTML subscript is unaffected.
    expect(html).toContain("<sub>2</sub>");
  });
});
