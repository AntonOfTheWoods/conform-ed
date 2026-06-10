import { describe, expect, test } from "bun:test";

import { isAllowedFlowElement, isInteractionKind, sanitizeAttributes, v0ContentModel } from "../src/content-model";

describe("content model allowlist", () => {
  test("allows v0 flow + language elements, rejects others", () => {
    expect(isAllowedFlowElement(v0ContentModel, "p")).toBe(true);
    expect(isAllowedFlowElement(v0ContentModel, "ruby")).toBe(true);
    expect(isAllowedFlowElement(v0ContentModel, "math")).toBe(true);
    expect(isAllowedFlowElement(v0ContentModel, "script")).toBe(false);
    expect(isAllowedFlowElement(v0ContentModel, "iframe")).toBe(false);
  });

  test("recognizes v0 interaction kinds", () => {
    expect(isInteractionKind(v0ContentModel, "choiceInteraction")).toBe(true);
    expect(isInteractionKind(v0ContentModel, "uploadInteraction")).toBe(false);
  });
});

describe("sanitizeAttributes", () => {
  test("keeps allowlisted attributes", () => {
    expect(sanitizeAttributes(v0ContentModel, { class: "lead", lang: "ja", id: "q1" })).toEqual({
      class: "lead",
      lang: "ja",
      id: "q1",
    });
  });

  test("drops event handlers, javascript: urls, style, and unknown attributes", () => {
    expect(
      sanitizeAttributes(v0ContentModel, {
        onclick: "steal()",
        onLoad: "x()",
        href: "javascript:alert(1)",
        style: "color:red",
        "data-x": "1",
        class: "ok",
      }),
    ).toEqual({ class: "ok" });
  });

  test("handles missing attributes", () => {
    expect(sanitizeAttributes(v0ContentModel, undefined)).toEqual({});
  });
});
