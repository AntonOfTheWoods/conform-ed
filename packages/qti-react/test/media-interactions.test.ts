import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { qtiCoreInteractions } from "../src/interactions";
import { referenceSkin } from "../src/reference-skin";
import { matchCorrect } from "../src/response-processing";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";

const runtime = createQtiRuntime({
  interactions: qtiCoreInteractions,
  skin: referenceSkin,
  assetResolver: (href) => `https://cdn.example/pkg/${href}`,
});

function render(item: AssessmentItemView): string {
  return renderToStaticMarkup(createElement(runtime.ItemRenderer, { item }));
}

function bodyItem(content: AssessmentItemView["itemBody"]["content"]): AssessmentItemView {
  return {
    responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "identifier" }],
    itemBody: { ...(content === undefined ? {} : { content }) },
  };
}

describe("media content elements (per-milestone content-model growth)", () => {
  test("img renders with element-specific attributes, src routed through the Asset Resolver", () => {
    const html = render(
      bodyItem([
        {
          kind: "xml",
          name: "img",
          attributes: { src: "images/fuji.jpg", alt: "Mount Fuji", width: "300", onload: "x()" },
        },
      ]),
    );

    expect(html).toContain('src="https://cdn.example/pkg/images/fuji.jpg"');
    expect(html).toContain('alt="Mount Fuji"');
    expect(html).toContain('width="300"');
    expect(html).not.toContain("onload");
  });

  test("audio and video render with controls; javascript: URLs are dropped", () => {
    const html = render(
      bodyItem([
        { kind: "xml", name: "audio", attributes: { src: "audio/kawa.mp3", controls: "controls" } },
        { kind: "xml", name: "video", attributes: { src: "javascript:alert(1)", controls: "controls" } },
      ]),
    );

    expect(html).toContain('src="https://cdn.example/pkg/audio/kawa.mp3"');
    expect(html).toContain("<audio");
    expect(html).toContain("<video");
    expect(html).not.toContain("javascript:");
  });

  test("element-specific attributes do not leak across elements", () => {
    const html = render(bodyItem([{ kind: "xml", name: "p", attributes: { src: "x.mp3" }, value: "text" }]));

    expect(html).not.toContain("src=");
  });

  test("media elements are deliverable, not capability issues", () => {
    const report = runtime.canDeliver(bodyItem([{ kind: "xml", name: "img", attributes: { src: "a.png", alt: "" } }]));

    expect(report.deliverable).toBe(true);
  });
});

describe("numeric baseTypes compare numerically", () => {
  test("float correctResponse matches numerically equal strings", () => {
    const declaration = {
      identifier: "RESPONSE",
      cardinality: "single" as const,
      baseType: "float",
      correctResponse: { values: [{ value: "5" }] },
    };

    expect(matchCorrect(declaration, "5.0")).toBe(true);
    expect(matchCorrect(declaration, "5")).toBe(true);
    expect(matchCorrect(declaration, "4.999")).toBe(false);
  });
});

describe("sliderInteraction", () => {
  const item: AssessmentItemView = {
    responseDeclarations: [
      {
        identifier: "RESPONSE",
        cardinality: "single",
        baseType: "integer",
        correctResponse: { values: [{ value: "7" }] },
      },
    ],
    itemBody: {
      content: [
        {
          kind: "sliderInteraction",
          responseIdentifier: "RESPONSE",
          lowerBound: 0,
          upperBound: 10,
          step: 1,
          prompt: { content: [{ kind: "xml", name: "p", value: "Rate from 0 to 10." }] },
        },
      ],
    },
  };

  test("is deliverable and renders a range input with bounds", () => {
    expect(runtime.canDeliver(item).deliverable).toBe(true);

    const html = render(item);

    expect(html).toContain('type="range"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="10"');
    expect(html).toContain('step="1"');
    expect(html).toContain("Rate from 0 to 10.");
  });
});

describe("uploadInteraction", () => {
  const item: AssessmentItemView = {
    responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "file" }],
    itemBody: {
      content: [
        {
          kind: "uploadInteraction",
          responseIdentifier: "RESPONSE",
          prompt: { content: [{ kind: "xml", name: "p", value: "Upload your essay." }] },
        },
      ],
    },
  };

  test("is deliverable and renders a file input", () => {
    expect(runtime.canDeliver(item).deliverable).toBe(true);

    const html = render(item);

    expect(html).toContain('type="file"');
    expect(html).toContain("Upload your essay.");
  });
});

describe("mediaInteraction", () => {
  const item: AssessmentItemView = {
    responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "integer" }],
    itemBody: {
      content: [
        {
          kind: "mediaInteraction",
          responseIdentifier: "RESPONSE",
          maxPlays: 2,
          content: [
            {
              kind: "xml",
              name: "audio",
              attributes: { src: "audio/dialogue.mp3" },
            },
          ],
        },
      ],
    },
  };

  test("is deliverable and renders the media element with resolved src and controls", () => {
    expect(runtime.canDeliver(item).deliverable).toBe(true);

    const html = render(item);

    expect(html).toContain("<audio");
    expect(html).toContain('src="https://cdn.example/pkg/audio/dialogue.mp3"');
    expect(html).toContain("controls");
    expect(html).toContain('data-qti-interaction="mediaInteraction"');
  });
});

describe("registry completeness for this rung", () => {
  test("slider, upload, and media ship with descriptors and reference skins", () => {
    const kinds = qtiCoreInteractions.map((descriptor) => descriptor.kind);

    for (const kind of ["sliderInteraction", "uploadInteraction", "mediaInteraction"]) {
      expect(kinds).toContain(kind);
      expect(referenceSkin[kind]).toBeDefined();
    }
  });
});
