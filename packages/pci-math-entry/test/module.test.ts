/**
 * The math-entry PCI module against the qti-react host contract: getInstance /
 * getResponse / getState. The input widget is injected (MathInputFactory) so these
 * tests run without MathLive; the response of record is the agreed PCI JSON record —
 * expression (the learner's LaTeX) plus an advisory verdict that exists only when the
 * item carries checker config (high-stakes deliveries redact it and score server-side).
 */

import { describe, expect, test } from "bun:test";

import { Window } from "happy-dom";

import { createPciModuleRegistry, mountPci } from "@conform-ed/qti-react";

import { createMathEntryModule, mathEntryTypeIdentifier } from "../src/module";
import type { MathInputFactory, MathInputHandle } from "../src/module";

const window = new Window();
const document = window.document;

function fakeInput(): { factory: MathInputFactory; handles: MathInputHandle[]; initials: string[] } {
  const handles: MathInputHandle[] = [];
  const initials: string[] = [];
  const factory: MathInputFactory = (container, options) => {
    let value = options.initialLatex;

    initials.push(options.initialLatex);
    container.appendChild(container.ownerDocument.createElement("span"));

    const handle: MathInputHandle = {
      getValue: () => value,
      setValue: (latex) => {
        value = latex;
      },
    };

    handles.push(handle);
    return handle;
  };

  return { factory, handles, initials };
}

function instantiate(properties: Readonly<Record<string, string>>, state?: string) {
  const input = fakeInput();
  const module = createMathEntryModule(input.factory);
  const dom = document.createElement("div") as unknown as Element;
  const instance = module.getInstance(dom, { properties }, state);

  if (!instance) {
    throw new Error("getInstance returned undefined");
  }

  return { instance, input, dom };
}

describe("math-entry PCI module", () => {
  test("identifies itself with the documented type identifier", () => {
    const module = createMathEntryModule(fakeInput().factory);

    expect(mathEntryTypeIdentifier).toBe("urn:conform-ed:pci:math-entry");
    expect(module.typeIdentifier).toBe(mathEntryTypeIdentifier);
  });

  test("response is the {expression, verdict} record when checker config is present", () => {
    const { instance, input } = instantiate({ correct: "2x" });

    input.handles[0]!.setValue("x+x");

    expect(instance.getResponse()).toEqual({
      record: [
        { name: "expression", base: { string: "x+x" } },
        { name: "verdict", base: { boolean: true } },
      ],
    });
  });

  test("a redacted item (no correct property) yields expression only", () => {
    const { instance, input } = instantiate({});

    input.handles[0]!.setValue("x+x");

    expect(instance.getResponse()).toEqual({ record: [{ name: "expression", base: { string: "x+x" } }] });
  });

  test("an unjudgeable expression omits the verdict instead of guessing", () => {
    const { instance, input } = instantiate({ correct: "x" });

    input.handles[0]!.setValue("\\frac{");

    expect(instance.getResponse()).toEqual({ record: [{ name: "expression", base: { string: "\\frac{" } }] });
  });

  test("an empty expression is a null base and carries no verdict", () => {
    const { instance } = instantiate({ correct: "x" });

    expect(instance.getResponse()).toEqual({ record: [{ name: "expression", base: null }] });
  });

  test("mode and tolerance properties configure the checker", () => {
    const literal = instantiate({ correct: "\\frac{1}{2}", mode: "literal" });

    literal.input.handles[0]!.setValue("\\frac{2}{4}");

    expect(literal.instance.getResponse()).toEqual({
      record: [
        { name: "expression", base: { string: "\\frac{2}{4}" } },
        { name: "verdict", base: { boolean: false } },
      ],
    });

    const tolerant = instantiate({ correct: "12.34", tolerance: "0.01" });

    tolerant.input.handles[0]!.setValue("12.339");

    expect(tolerant.instance.getResponse()).toEqual({
      record: [
        { name: "expression", base: { string: "12.339" } },
        { name: "verdict", base: { boolean: true } },
      ],
    });
  });

  test("state restores the expression and round-trips through getState", () => {
    const { instance, input } = instantiate({ correct: "x" }, JSON.stringify({ expression: "x+1" }));

    expect(input.initials[0]).toBe("x+1");
    expect(JSON.parse(instance.getState?.() ?? "{}")).toEqual({ expression: "x+1" });
  });

  test("mounts through the qti-react host and collects a record ResponseValue", async () => {
    const input = fakeInput();
    const registry = createPciModuleRegistry();

    registry.registerModule("math-entry", createMathEntryModule(input.factory));

    const container = document.createElement("div") as unknown as Element;
    const handle = await mountPci({
      container,
      node: {
        kind: "portableCustomInteraction",
        responseIdentifier: "RESPONSE",
        customInteractionTypeIdentifier: mathEntryTypeIdentifier,
        properties: { correct: "2x" },
      },
      registry,
      declaration: { identifier: "RESPONSE", cardinality: "record" },
    });

    input.handles[0]!.setValue("x+x");

    expect(handle.collectResponse()).toEqual({ expression: "x+x", verdict: true });

    handle.unmount();
  });
});
