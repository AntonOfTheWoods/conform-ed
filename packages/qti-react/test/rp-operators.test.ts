/**
 * Histogram-driven evaluator growth (ADR-0004): equal (with tolerance), round,
 * truncate, and index — the operators the official corpus uses most among those the
 * interpreter lacked. Spec-strict: unsupported variants (non-numeric tolerance) abort
 * to defaults and surface as issues, never guess.
 */

import { describe, expect, test } from "bun:test";

import { executeResponseProcessing } from "../src/rp";
import type { ResponseProcessingView, RpExpressionView } from "../src/rp";

const outcomeDeclarations = [{ identifier: "OUT", cardinality: "single" as const, baseType: "float" }];

function run(expression: RpExpressionView, responses: Record<string, string | null> = {}) {
  const view: ResponseProcessingView = {
    rules: [{ kind: "setOutcomeValue", identifier: "OUT", expression }],
  };

  return executeResponseProcessing(view, {
    responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "float" }],
    outcomeDeclarations,
    responses,
  });
}

function baseValue(value: string, baseType = "float"): RpExpressionView {
  return { kind: "baseValue", baseType, value };
}

describe("equal", () => {
  test("exact mode (the default) compares numerically", () => {
    expect(run({ kind: "equal", expressions: [baseValue("3"), baseValue("3.0")] }).outcomes["OUT"]).toBe(true);
    expect(run({ kind: "equal", expressions: [baseValue("3"), baseValue("3.01")] }).outcomes["OUT"]).toBe(false);
  });

  test("absolute tolerance accepts values inside the window", () => {
    const expression: RpExpressionView = {
      kind: "equal",
      toleranceMode: "absolute",
      tolerance: [0.01],
      expressions: [baseValue("3.1416"), baseValue("3.1416")],
    };

    expect(run(expression).outcomes["OUT"]).toBe(true);
    expect(run({ ...expression, expressions: [baseValue("3.1416"), baseValue("3.15")] }).outcomes["OUT"]).toBe(true);
    expect(run({ ...expression, expressions: [baseValue("3.1416"), baseValue("3.16")] }).outcomes["OUT"]).toBe(false);
  });

  test("relative tolerance is a percentage window", () => {
    const expression: RpExpressionView = {
      kind: "equal",
      toleranceMode: "relative",
      tolerance: [15],
      expressions: [baseValue("100"), baseValue("110")],
    };

    expect(run(expression).outcomes["OUT"]).toBe(true);
    expect(run({ ...expression, tolerance: [5] }).outcomes["OUT"]).toBe(false);
  });

  test("exclusive bounds honor includeLowerBound/includeUpperBound", () => {
    const expression: RpExpressionView = {
      kind: "equal",
      toleranceMode: "absolute",
      tolerance: [1],
      includeUpperBound: false,
      expressions: [baseValue("10"), baseValue("11")],
    };

    expect(run(expression).outcomes["OUT"]).toBe(false);
  });

  test("template-variable tolerances are unsupported, aborting to defaults", () => {
    const result = run({
      kind: "equal",
      toleranceMode: "absolute",
      tolerance: ["T0"],
      expressions: [baseValue("1"), baseValue("1")],
    });

    expect(result.issues.length).toBeGreaterThan(0);
    // Abort-to-defaults: numeric outcomes fall back to 0 (QTI default), never partial.
    expect(result.outcomes["OUT"]).toBe(0);
  });

  test("null operands yield null", () => {
    const result = run({
      kind: "equal",
      expressions: [{ kind: "variable", identifier: "RESPONSE" }, baseValue("1")],
    });

    expect(result.outcomes["OUT"]).toBeNull();
    expect(result.issues).toEqual([]);
  });
});

describe("round and truncate", () => {
  test("round rounds half up, truncate drops the fraction", () => {
    expect(run({ kind: "round", expressions: [baseValue("3.5")] }).outcomes["OUT"]).toBe(4);
    expect(run({ kind: "round", expressions: [baseValue("-3.5")] }).outcomes["OUT"]).toBe(-3);
    expect(run({ kind: "truncate", expressions: [baseValue("3.9")] }).outcomes["OUT"]).toBe(3);
    expect(run({ kind: "truncate", expressions: [baseValue("-3.9")] }).outcomes["OUT"]).toBe(-3);
  });
});

describe("index", () => {
  const container: RpExpressionView = {
    kind: "ordered",
    expressions: [baseValue("A", "identifier"), baseValue("B", "identifier"), baseValue("C", "identifier")],
  };

  test("selects the 1-based n-th member of an ordered container", () => {
    expect(run({ kind: "index", n: 2, expressions: [container] }).outcomes["OUT"]).toBe("B");
  });

  test("out-of-range n yields null", () => {
    expect(run({ kind: "index", n: 9, expressions: [container] }).outcomes["OUT"]).toBeNull();
  });
});
