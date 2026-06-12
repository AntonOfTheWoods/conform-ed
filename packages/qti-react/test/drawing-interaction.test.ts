/**
 * drawingInteraction: a canvas drawing surface over a stage image, with the candidate's
 * drawing captured as a data-URL `file` response (the upload convention). Stage media
 * arrives as `<object>` or `<picture>`/`<img>` and adapts to the graphic-family
 * `object` shape.
 */

import { describe, expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { qtiCoreInteractions } from "../src/interactions";
import { assessmentItemViewFromNormalized } from "../src/normalized-item";
import { referenceSkin } from "../src/reference-skin";
import { createQtiRuntime, type AssessmentItemView } from "../src/runtime";

const runtime = createQtiRuntime({ interactions: qtiCoreInteractions, skin: referenceSkin });

const item: AssessmentItemView = {
  responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "file" }],
  outcomeDeclarations: [{ identifier: "SCORE", cardinality: "single", baseType: "float" }],
  itemBody: {
    content: [
      {
        kind: "drawingInteraction",
        responseIdentifier: "RESPONSE",
        prompt: { content: [{ kind: "xml", name: "p", value: "Colour the roof red." }] },
        object: { data: "images/house.png", width: 144, height: 260, type: "image/png" },
      },
    ],
  },
};

describe("drawingInteraction", () => {
  test("is deliverable against the core runtime", () => {
    expect(runtime.canDeliver(item).issues).toEqual([]);
  });

  test("renders a canvas sized to the stage with prompt and clear control", () => {
    const html = renderToStaticMarkup(createElement(runtime.ItemRenderer, { item }));

    expect(html).toContain('data-qti-interaction="drawingInteraction"');
    expect(html).toContain("Colour the roof red.");
    expect(html).toContain("<canvas");
    expect(html).toContain('width="144"');
    expect(html).toContain('height="260"');
    expect(html).toContain(">Clear<");
  });
});

describe("drawingInteraction adapter reshaping", () => {
  test("an <object> stage adapts to the graphic-family object shape", () => {
    const view = assessmentItemViewFromNormalized({
      assessmentItem: {
        identifier: "drawing",
        responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "file" }],
        itemBody: {
          content: [
            {
              kind: "drawingInteraction",
              responseIdentifier: "RESPONSE",
              prompt: { kind: "prompt", content: ["Colour the picture."] },
              content: [
                {
                  kind: "xml",
                  name: "object",
                  attributes: { type: "image/png", data: "images/house.png", width: "144", height: "260" },
                },
              ],
            },
          ],
        },
      },
    })!;

    expect(view.itemBody.content?.[0]).toMatchObject({
      kind: "drawingInteraction",
      object: { data: "images/house.png", width: 144, height: 260, type: "image/png" },
    });
  });

  test("a <picture> stage drills into the img source", () => {
    const view = assessmentItemViewFromNormalized({
      assessmentItem: {
        identifier: "drawing-picture",
        responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "file" }],
        itemBody: {
          content: [
            {
              kind: "drawingInteraction",
              responseIdentifier: "RESPONSE",
              content: [
                {
                  kind: "xml",
                  name: "picture",
                  children: [
                    { kind: "xml", name: "source", attributes: { srcset: "images/angle.svg" } },
                    {
                      kind: "xml",
                      name: "img",
                      attributes: { src: "images/angle_HiRes.jpg", width: "322", height: "260", alt: "angle PQR" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    })!;

    expect(view.itemBody.content?.[0]).toMatchObject({
      kind: "drawingInteraction",
      object: { data: "images/angle_HiRes.jpg", width: 322, height: 260 },
    });
  });
});
