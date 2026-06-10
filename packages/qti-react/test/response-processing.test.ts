import { describe, expect, test } from "bun:test";

import { foldString, mapResponse, matchCorrect, scoreResponse } from "../src/response-processing";
import type { ResponseDeclarationView } from "../src/types";

const singleChoice: ResponseDeclarationView = {
  identifier: "RESPONSE",
  cardinality: "single",
  baseType: "identifier",
  correctResponse: { values: [{ value: "ChoiceB" }] },
};

const multipleChoice: ResponseDeclarationView = {
  identifier: "RESPONSE",
  cardinality: "multiple",
  baseType: "identifier",
  correctResponse: { values: [{ value: "A" }, { value: "C" }] },
};

const textEntry: ResponseDeclarationView = {
  identifier: "RESPONSE",
  cardinality: "single",
  baseType: "string",
  correctResponse: { values: [{ value: "café" }] },
};

const mapped: ResponseDeclarationView = {
  identifier: "RESPONSE",
  cardinality: "multiple",
  baseType: "identifier",
  mapping: {
    mapEntries: [
      { mapKey: "A", mappedValue: 1 },
      { mapKey: "B", mappedValue: -0.5 },
      { mapKey: "C", mappedValue: 1 },
    ],
    lowerBound: 0,
    upperBound: 2,
    defaultValue: 0,
  },
};

describe("foldString", () => {
  test("lowercases and strips diacritics", () => {
    expect(foldString("Café")).toBe("cafe");
    expect(foldString("NAÏVE")).toBe("naive");
  });
});

describe("matchCorrect", () => {
  test("single identifier exact match", () => {
    expect(matchCorrect(singleChoice, "ChoiceB")).toBe(true);
    expect(matchCorrect(singleChoice, "ChoiceA")).toBe(false);
    expect(matchCorrect(singleChoice, null)).toBe(false);
  });

  test("identifier base type does not fold case", () => {
    expect(matchCorrect(singleChoice, "choiceb")).toBe(false);
  });

  test("string base type folds case and diacritics", () => {
    expect(matchCorrect(textEntry, "cafe")).toBe(true);
    expect(matchCorrect(textEntry, "CAFÉ")).toBe(true);
    expect(matchCorrect(textEntry, "tea")).toBe(false);
  });

  test("multiple cardinality is order-independent and requires exact set", () => {
    expect(matchCorrect(multipleChoice, ["C", "A"])).toBe(true);
    expect(matchCorrect(multipleChoice, ["A"])).toBe(false);
    expect(matchCorrect(multipleChoice, ["A", "C", "B"])).toBe(false);
  });
});

describe("mapResponse", () => {
  test("sums mapped values and clamps to bounds", () => {
    expect(mapResponse(mapped, ["A", "C"])).toBe(2);
    expect(mapResponse(mapped, ["A"])).toBe(1);
    expect(mapResponse(mapped, ["B"])).toBe(0); // clamped to lowerBound 0
  });

  test("unmatched members use defaultValue and each member maps once", () => {
    expect(mapResponse(mapped, ["A", "A", "C"])).toBe(2); // clamped from 3
    expect(mapResponse(mapped, ["unknown"])).toBe(0);
  });
});

describe("scoreResponse", () => {
  test("match_correct yields score 1/maxScore 1", () => {
    expect(scoreResponse(singleChoice, "ChoiceB")).toEqual({
      identifier: "RESPONSE",
      score: 1,
      maxScore: 1,
      correct: true,
    });
  });

  test("map_response yields summed score with derived maxScore", () => {
    const result = scoreResponse(mapped, ["A", "C"]);
    expect(result.score).toBe(2);
    expect(result.maxScore).toBe(2);
    expect(result.correct).toBe(true);
  });

  test("partial mapped score is not marked correct", () => {
    const result = scoreResponse(mapped, ["A"]);
    expect(result.score).toBe(1);
    expect(result.correct).toBe(false);
  });
});
