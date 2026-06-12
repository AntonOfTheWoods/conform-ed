import { describe, expect, test } from "bun:test";

import { collectRpIssues, executeResponseProcessing, mulberry32 } from "../src/rp";
import type { OutcomeDeclarationView, ResponseProcessingView } from "../src/rp";
import type { ResponseDeclarationView, ResponseValue } from "../src/types";

const scoreOutcome: OutcomeDeclarationView = { identifier: "SCORE", cardinality: "single", baseType: "float" };

const singleChoice: ResponseDeclarationView = {
  identifier: "RESPONSE",
  cardinality: "single",
  baseType: "identifier",
  correctResponse: { values: [{ value: "B" }] },
};

function run(
  responseProcessing: ResponseProcessingView,
  responses: Record<string, ResponseValue>,
  declarations: readonly ResponseDeclarationView[] = [singleChoice],
  outcomes: readonly OutcomeDeclarationView[] = [scoreOutcome],
) {
  return executeResponseProcessing(responseProcessing, {
    responseDeclarations: declarations,
    outcomeDeclarations: outcomes,
    responses,
  });
}

describe("standard template URIs resolve to built-in canonical trees", () => {
  const template: ResponseProcessingView = {
    template: "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct",
  };

  test("match_correct: correct response scores 1", () => {
    expect(run(template, { RESPONSE: "B" }).outcomes["SCORE"]).toBe(1);
  });

  test("match_correct: wrong or missing response scores 0", () => {
    expect(run(template, { RESPONSE: "A" }).outcomes["SCORE"]).toBe(0);
    expect(run(template, {}).outcomes["SCORE"]).toBe(0);
  });

  test("CC2_match scores 1/0 like match_correct", () => {
    const view: ResponseProcessingView = {
      template: "https://www.imsglobal.org/question/qti_v3p0/rptemplates/CC2_match.xml",
    };

    expect(run(view, { RESPONSE: "B" }).outcomes["SCORE"]).toBe(1);
    expect(run(view, { RESPONSE: "A" }).outcomes["SCORE"]).toBe(0);
  });

  test("CC2_match_basic awards MAXSCORE and sets FEEDBACKBASIC", () => {
    const view: ResponseProcessingView = {
      template: "https://www.imsglobal.org/question/qti_v3p0/rptemplates/CC2_match_basic.xml",
    };
    const outcomes: readonly OutcomeDeclarationView[] = [
      scoreOutcome,
      {
        identifier: "MAXSCORE",
        cardinality: "single",
        baseType: "float",
        defaultValue: { values: [{ value: 10 }] },
      },
      { identifier: "FEEDBACKBASIC", cardinality: "single", baseType: "identifier" },
    ];

    const correct = run(view, { RESPONSE: "B" }, [singleChoice], outcomes);
    expect(correct.outcomes["SCORE"]).toBe(10);
    expect(correct.outcomes["FEEDBACKBASIC"]).toBe("correct");

    const wrong = run(view, { RESPONSE: "A" }, [singleChoice], outcomes);
    expect(wrong.outcomes["FEEDBACKBASIC"]).toBe("incorrect");
  });

  test("CC2_map_response maps the response and derives FEEDBACK from MAXSCORE", () => {
    const view: ResponseProcessingView = {
      template: "https://www.imsglobal.org/question/qti_v3p0/rptemplates/CC2_map_response.xml",
    };
    const mapped: ResponseDeclarationView = {
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "string",
      mapping: { defaultValue: 0, mapEntries: [{ mapKey: "york", mappedValue: 1 }] },
    };
    const outcomes: readonly OutcomeDeclarationView[] = [
      scoreOutcome,
      {
        identifier: "MAXSCORE",
        cardinality: "single",
        baseType: "float",
        defaultValue: { values: [{ value: 1 }] },
      },
      { identifier: "FEEDBACK", cardinality: "single", baseType: "identifier" },
    ];

    const full = run(view, { RESPONSE: "york" }, [mapped], outcomes);
    expect(full.outcomes["SCORE"]).toBe(1);
    expect(full.outcomes["FEEDBACK"]).toBe("correct");

    const empty = run(view, { RESPONSE: null }, [mapped], outcomes);
    expect(empty.outcomes["SCORE"]).toBe(0);
    expect(empty.outcomes["FEEDBACK"]).toBe("incorrect");
  });

  test("map_response: maps members, null response scores 0", () => {
    const mapped: ResponseDeclarationView = {
      identifier: "RESPONSE",
      cardinality: "multiple",
      baseType: "identifier",
      mapping: {
        defaultValue: 0,
        mapEntries: [
          { mapKey: "A", mappedValue: 1 },
          { mapKey: "C", mappedValue: 2 },
        ],
      },
    };
    const view: ResponseProcessingView = {
      template: "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response",
    };

    expect(run(view, { RESPONSE: ["A", "C"] }, [mapped]).outcomes["SCORE"]).toBe(3);
    expect(run(view, {}, [mapped]).outcomes["SCORE"]).toBe(0);
  });

  test("unknown template URI is reported and outcomes keep defaults", () => {
    const result = run({ template: "https://example.com/rptemplates/bespoke" }, { RESPONSE: "B" });

    expect(result.issues[0]?.type).toBe("unsupported-rp");
    expect(result.outcomes["SCORE"]).toBe(0);
  });
});

describe("explicit rule trees", () => {
  test("responseCondition if/elseIf/else with setOutcomeValue", () => {
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "responseCondition",
          responseIf: {
            expression: {
              kind: "match",
              expressions: [
                { kind: "variable", identifier: "RESPONSE" },
                { kind: "correct", identifier: "RESPONSE" },
              ],
            },
            rules: [
              {
                kind: "setOutcomeValue",
                identifier: "SCORE",
                expression: { kind: "baseValue", baseType: "float", value: 2 },
              },
            ],
          },
          responseElseIfs: [
            {
              expression: {
                kind: "isNull",
                expressions: [{ kind: "variable", identifier: "RESPONSE" }],
              },
              rules: [
                {
                  kind: "setOutcomeValue",
                  identifier: "SCORE",
                  expression: { kind: "baseValue", baseType: "float", value: 0 },
                },
              ],
            },
          ],
          responseElse: {
            rules: [
              {
                kind: "setOutcomeValue",
                identifier: "SCORE",
                expression: { kind: "baseValue", baseType: "float", value: -1 },
              },
            ],
          },
        },
      ],
    };

    expect(run(view, { RESPONSE: "B" }).outcomes["SCORE"]).toBe(2);
    expect(run(view, {}).outcomes["SCORE"]).toBe(0);
    expect(run(view, { RESPONSE: "A" }).outcomes["SCORE"]).toBe(-1);
  });

  test("logical and numeric operators: and/or/not, sum/gt, member", () => {
    const hottext: ResponseDeclarationView = {
      identifier: "RESPONSE",
      cardinality: "multiple",
      baseType: "identifier",
      correctResponse: { values: [{ value: "H2" }] },
    };
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "responseCondition",
          responseIf: {
            expression: {
              kind: "and",
              expressions: [
                {
                  kind: "member",
                  expressions: [
                    { kind: "baseValue", baseType: "identifier", value: "H2" },
                    { kind: "variable", identifier: "RESPONSE" },
                  ],
                },
                {
                  kind: "not",
                  expressions: [
                    {
                      kind: "member",
                      expressions: [
                        { kind: "baseValue", baseType: "identifier", value: "H1" },
                        { kind: "variable", identifier: "RESPONSE" },
                      ],
                    },
                  ],
                },
              ],
            },
            rules: [
              {
                kind: "setOutcomeValue",
                identifier: "SCORE",
                expression: {
                  kind: "sum",
                  expressions: [
                    { kind: "baseValue", baseType: "float", value: 0.5 },
                    { kind: "baseValue", baseType: "float", value: 0.5 },
                  ],
                },
              },
            ],
          },
          responseElse: {
            rules: [
              {
                kind: "setOutcomeValue",
                identifier: "SCORE",
                expression: { kind: "baseValue", baseType: "float", value: 0 },
              },
            ],
          },
        },
        {
          kind: "responseCondition",
          responseIf: {
            expression: {
              kind: "gt",
              expressions: [
                { kind: "variable", identifier: "SCORE" },
                { kind: "baseValue", baseType: "float", value: 0.75 },
              ],
            },
            rules: [
              {
                kind: "setOutcomeValue",
                identifier: "FEEDBACK",
                expression: { kind: "baseValue", baseType: "identifier", value: "WELL_DONE" },
              },
            ],
          },
        },
      ],
    };
    const outcomes: readonly OutcomeDeclarationView[] = [
      scoreOutcome,
      { identifier: "FEEDBACK", cardinality: "single", baseType: "identifier" },
    ];

    const correct = run(view, { RESPONSE: ["H2"] }, [hottext], outcomes);

    expect(correct.outcomes["SCORE"]).toBe(1);
    expect(correct.outcomes["FEEDBACK"]).toBe("WELL_DONE");

    const wrong = run(view, { RESPONSE: ["H1", "H2"] }, [hottext], outcomes);

    expect(wrong.outcomes["SCORE"]).toBe(0);
    expect(wrong.outcomes["FEEDBACK"]).toBeNull();
  });

  test("exitResponse stops execution", () => {
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "SCORE",
          expression: { kind: "baseValue", baseType: "float", value: 1 },
        },
        { kind: "exitResponse" },
        {
          kind: "setOutcomeValue",
          identifier: "SCORE",
          expression: { kind: "baseValue", baseType: "float", value: 99 },
        },
      ],
    };

    expect(run(view, {}).outcomes["SCORE"]).toBe(1);
  });

  test("outcome defaults: declared defaultValue wins, numeric undeclared default to 0, others null", () => {
    const outcomes: readonly OutcomeDeclarationView[] = [
      scoreOutcome,
      {
        identifier: "THRESHOLD",
        cardinality: "single",
        baseType: "float",
        defaultValue: { values: [{ value: 0.5 }] },
      },
      { identifier: "FEEDBACK", cardinality: "single", baseType: "identifier" },
    ];

    const result = run({ rules: [] }, {}, [singleChoice], outcomes);

    expect(result.outcomes["SCORE"]).toBe(0);
    expect(result.outcomes["THRESHOLD"]).toBe(0.5);
    expect(result.outcomes["FEEDBACK"]).toBeNull();
  });

  test("pair equality applies inside match", () => {
    const pairDeclaration: ResponseDeclarationView = {
      identifier: "RESPONSE",
      cardinality: "multiple",
      baseType: "pair",
      correctResponse: { values: [{ value: "A B" }] },
    };
    const view: ResponseProcessingView = {
      template: "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct",
    };

    expect(run(view, { RESPONSE: ["B A"] }, [pairDeclaration]).outcomes["SCORE"]).toBe(1);
  });

  test("unsupported operator aborts to defaults and reports", () => {
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "SCORE",
          expression: { kind: "customOperator", expressions: [] },
        },
      ],
    };

    const result = run(view, { RESPONSE: "B" });

    expect(result.issues[0]?.type).toBe("unsupported-rp");
    expect(result.issues[0]?.name).toBe("customOperator");
    expect(result.outcomes["SCORE"]).toBe(0);
  });
});

describe("spec-strict string matching with opt-in normalization (ADR-0004)", () => {
  const textEntry: ResponseDeclarationView = {
    identifier: "RESPONSE",
    cardinality: "single",
    baseType: "string",
    correctResponse: { values: [{ value: "café" }] },
  };
  const template: ResponseProcessingView = {
    template: "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct",
  };

  test("strict by default: case/diacritics must match exactly", () => {
    expect(run(template, { RESPONSE: "cafe" }, [textEntry]).outcomes["SCORE"]).toBe(0);
    expect(run(template, { RESPONSE: "café" }, [textEntry]).outcomes["SCORE"]).toBe(1);
  });

  test("normalization hook restores leniency when the consumer opts in", () => {
    const result = executeResponseProcessing(template, {
      responseDeclarations: [textEntry],
      outcomeDeclarations: [scoreOutcome],
      responses: { RESPONSE: "CAFE" },
      normalization: (value) =>
        value
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLocaleLowerCase(),
    });

    expect(result.outcomes["SCORE"]).toBe(1);
  });
});

describe("seeded random in response processing (adaptive items)", () => {
  const revealRules: ResponseProcessingView = {
    rules: [
      {
        kind: "setOutcomeValue",
        identifier: "REVEALED",
        expression: {
          kind: "random",
          expressions: [
            {
              kind: "multiple",
              expressions: [
                { kind: "baseValue", baseType: "identifier", value: "DoorB" },
                { kind: "baseValue", baseType: "identifier", value: "DoorC" },
              ],
            },
          ],
        },
      },
    ],
  };
  const revealed: OutcomeDeclarationView = { identifier: "REVEALED", cardinality: "single", baseType: "identifier" };

  function runSeeded(random: () => number) {
    return executeResponseProcessing(revealRules, {
      responseDeclarations: [singleChoice],
      outcomeDeclarations: [revealed],
      responses: {},
      random,
    });
  }

  test("random picks from the container using the provided seeded source", () => {
    const low = runSeeded(() => 0);
    const high = runSeeded(() => 0.99);

    expect(low.issues).toEqual([]);
    expect(low.outcomes["REVEALED"]).toBe("DoorB");
    expect(high.outcomes["REVEALED"]).toBe("DoorC");
  });

  test("the same seed replays the same outcome", () => {
    const first = runSeeded(mulberry32(7));
    const second = runSeeded(mulberry32(7));

    expect(first.outcomes["REVEALED"]).toBe(second.outcomes["REVEALED"]);
  });

  test("without a random source the construct still aborts to defaults", () => {
    const result = run(revealRules, {}, [singleChoice], [revealed]);

    expect(result.issues[0]?.name).toBe("random");
    expect(result.outcomes["REVEALED"]).toBeNull();
  });

  test("collectRpIssues accepts random — the attempt seed makes it deterministic", () => {
    expect(collectRpIssues(revealRules)).toEqual([]);
  });
});

describe("custom operators (extension seam)", () => {
  const reverseRules: ResponseProcessingView = {
    rules: [
      {
        kind: "setOutcomeValue",
        identifier: "OUT",
        expression: {
          kind: "customOperator",
          class: "demo.reverse",
          expressions: [{ kind: "baseValue", baseType: "string", value: "abc" }],
        },
      },
    ],
  };
  const outDeclaration: OutcomeDeclarationView = { identifier: "OUT", cardinality: "single", baseType: "string" };

  const demoReverse = (args: ReadonlyArray<{ values: readonly unknown[] } | null>) => {
    const input = args[0]?.values[0];

    return typeof input !== "string"
      ? null
      : { cardinality: "single" as const, baseType: "string", values: [input.split("").reverse().join("")] };
  };

  test("a registered implementation evaluates by class", () => {
    const result = executeResponseProcessing(reverseRules, {
      responseDeclarations: [singleChoice],
      outcomeDeclarations: [outDeclaration],
      responses: {},
      customOperators: { "demo.reverse": demoReverse as never },
    });

    expect(result.issues).toEqual([]);
    expect(result.outcomes["OUT"]).toBe("cba");
  });

  test("an unregistered class aborts to defaults and reports", () => {
    const result = executeResponseProcessing(reverseRules, {
      responseDeclarations: [singleChoice],
      outcomeDeclarations: [outDeclaration],
      responses: {},
    });

    expect(result.issues[0]?.name).toBe("customOperator");
    expect(result.outcomes["OUT"]).toBeNull();
  });

  test("the capability walk accepts only registered classes", () => {
    expect(collectRpIssues(reverseRules)[0]?.name).toBe("customOperator");
    expect(collectRpIssues(reverseRules, { customOperatorClasses: new Set(["demo.reverse"]) })).toEqual([]);
    expect(collectRpIssues(reverseRules, { customOperatorClasses: new Set(["other.class"]) })).toHaveLength(1);
  });
});

describe("record responses and fieldValue (PCI response contracts)", () => {
  const recordDeclaration: ResponseDeclarationView = { identifier: "RESPONSE", cardinality: "record" };
  const booleanOut: OutcomeDeclarationView = { identifier: "OUT", cardinality: "single", baseType: "boolean" };

  const fieldRules = (fieldIdentifier: string): ResponseProcessingView => ({
    rules: [
      {
        kind: "setOutcomeValue",
        identifier: "OUT",
        expression: {
          kind: "fieldValue",
          fieldIdentifier,
          expressions: [{ kind: "variable", identifier: "RESPONSE" }],
        },
      },
    ],
  });

  test("fieldValue extracts a typed boolean field from a record response", () => {
    const result = run(
      fieldRules("verdict"),
      { RESPONSE: { expression: "x+1", verdict: true } },
      [recordDeclaration],
      [booleanOut],
    );

    expect(result.issues).toEqual([]);
    expect(result.outcomes["OUT"]).toBe(true);
  });

  test("string fields extract with their own base type", () => {
    const stringOut: OutcomeDeclarationView = { identifier: "OUT", cardinality: "single", baseType: "string" };
    const result = run(
      fieldRules("expression"),
      { RESPONSE: { expression: "x+1", verdict: true } },
      [recordDeclaration],
      [stringOut],
    );

    expect(result.outcomes["OUT"]).toBe("x+1");
  });

  test("a missing field and an absent record are NULL", () => {
    expect(
      run(fieldRules("missing"), { RESPONSE: { verdict: false } }, [recordDeclaration], [booleanOut]).outcomes["OUT"],
    ).toBeNull();
    expect(run(fieldRules("verdict"), {}, [recordDeclaration], [booleanOut]).outcomes["OUT"]).toBeNull();
  });

  test("match scores an extracted boolean field against a base value", () => {
    const matchRules: ResponseProcessingView = {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "OUT",
          expression: {
            kind: "match",
            expressions: [
              {
                kind: "fieldValue",
                fieldIdentifier: "verdict",
                expressions: [{ kind: "variable", identifier: "RESPONSE" }],
              },
              { kind: "baseValue", baseType: "boolean", value: "true" },
            ],
          },
        },
      ],
    };
    const result = run(
      matchRules,
      { RESPONSE: { expression: "x+1", verdict: true } },
      [recordDeclaration],
      [booleanOut],
    );

    expect(result.issues).toEqual([]);
    expect(result.outcomes["OUT"]).toBe(true);
  });

  test("the capability walk accepts fieldValue", () => {
    expect(collectRpIssues(fieldRules("verdict"))).toEqual([]);
  });
});

describe("lookupOutcomeValue (matchTable/interpolationTable scoring)", () => {
  // "The lookupOutcomeValue rule sets the value of an outcome variable to the value
  // obtained by looking up the value of the associated expression in the lookupTable
  // associated with the outcome's declaration." (§5.87)
  const grade: OutcomeDeclarationView = {
    identifier: "GRADE",
    cardinality: "single",
    baseType: "identifier",
    // "A matchTable transforms a source integer by finding the first
    // qti-match-table-entry with an exact match to the source." (§5.90)
    matchTable: {
      defaultValue: "F",
      matchTableEntries: [
        { sourceValue: 1, targetValue: "A" },
        { sourceValue: 2, targetValue: "B" },
      ],
    },
  };
  const gradeNoDefault: OutcomeDeclarationView = {
    identifier: "GRADE",
    cardinality: "single",
    baseType: "identifier",
    matchTable: { matchTableEntries: [{ sourceValue: 1, targetValue: "A" }] },
  };

  const lookup = (expression: object): ResponseProcessingView => ({
    rules: [{ kind: "lookupOutcomeValue", identifier: "GRADE", expression: expression as never }],
  });
  const intSource = (value: number) => lookup({ kind: "baseValue", baseType: "integer", value });

  test("an exact integer match sets the first matching entry's target", () => {
    expect(run(intSource(1), {}, [singleChoice], [grade]).outcomes["GRADE"]).toBe("A");
  });

  test("no matching entry falls back to the table defaultValue", () => {
    // "The default outcome value to be used when no matching table entry is found." (§5.90.1)
    expect(run(intSource(7), {}, [singleChoice], [grade]).outcomes["GRADE"]).toBe("F");
  });

  test("no match and no defaultValue is NULL", () => {
    // "If omitted, the NULL value is used." (§5.90.1)
    expect(run(intSource(7), {}, [singleChoice], [gradeNoDefault]).outcomes["GRADE"]).toBeNull();
  });

  test("a NULL source matches no entry — defaultValue, else NULL (interpretive)", () => {
    // Spec-silent: a NULL source is read as "no matching table entry is found"
    // (§5.90.1), so the default applies; this is an interpretive call, not 3.0.1 text.
    const nullSource = lookup({ kind: "variable", identifier: "RESPONSE" });

    expect(run(nullSource, {}, [singleChoice], [grade]).outcomes["GRADE"]).toBe("F");
    expect(run(nullSource, {}, [singleChoice], [gradeNoDefault]).outcomes["GRADE"]).toBeNull();
  });

  test("a non-numeric source takes the default path, never a refusal", () => {
    // QTI 2.1 (interpretive heritage): the expression "must have single cardinality and
    // an effective baseType of either integer, float or duration".
    const stringSource = lookup({ kind: "baseValue", baseType: "string", value: "two" });
    const result = run(stringSource, {}, [singleChoice], [grade]);

    expect(result.issues).toEqual([]);
    expect(result.outcomes["GRADE"]).toBe("F");
  });

  test("a float source equal to an integer entry matches numerically", () => {
    const floatSource = lookup({ kind: "baseValue", baseType: "float", value: 2 });

    expect(run(floatSource, {}, [singleChoice], [grade]).outcomes["GRADE"]).toBe("B");
  });

  describe("interpolationTable", () => {
    // "An interpolationTable transforms a source float (or integer) by finding the
    // first interpolationTableEntry with a sourceValue that is less than or equal to
    // (subject to includeBoundary) the source value." (§5.78)
    const scaled: OutcomeDeclarationView = {
      identifier: "GRADE",
      cardinality: "single",
      baseType: "float",
      interpolationTable: {
        defaultValue: "0.1",
        interpolationTableEntries: [
          { sourceValue: 80, targetValue: "1.0" },
          { sourceValue: 50, targetValue: "0.5" },
        ],
      },
    };

    test("the first (document-order) entry at or below the source wins", () => {
      expect(run(intSource(65), {}, [singleChoice], [scaled]).outcomes["GRADE"]).toBe(0.5);
      expect(run(intSource(95), {}, [singleChoice], [scaled]).outcomes["GRADE"]).toBe(1);
    });

    test("below every entry falls to the defaultValue, coerced to the declared baseType", () => {
      expect(run(intSource(10), {}, [singleChoice], [scaled]).outcomes["GRADE"]).toBe(0.1);
    });

    test("includeBoundary defaults to true: an exact bound matches its entry", () => {
      // "If 'true', the default, then an exact match of the value is considered a
      // match of this entry." (§7.18.2)
      expect(run(intSource(80), {}, [singleChoice], [scaled]).outcomes["GRADE"]).toBe(1);
    });

    test("includeBoundary=false excludes the exact bound and falls through", () => {
      const exclusive: OutcomeDeclarationView = {
        ...scaled,
        interpolationTable: {
          interpolationTableEntries: [
            { sourceValue: 80, targetValue: "1.0", includeBoundary: false },
            { sourceValue: 50, targetValue: "0.5" },
          ],
        },
      };

      expect(run(intSource(80), {}, [singleChoice], [exclusive]).outcomes["GRADE"]).toBe(0.5);
    });

    test("document order decides, not numeric order: an ascending table short-circuits", () => {
      // The spec selects "the first interpolationTableEntry" in document order (§5.78);
      // authors are expected to order entries descending.
      const ascending: OutcomeDeclarationView = {
        ...scaled,
        interpolationTable: {
          interpolationTableEntries: [
            { sourceValue: 50, targetValue: "0.5" },
            { sourceValue: 80, targetValue: "1.0" },
          ],
        },
      };

      expect(run(intSource(95), {}, [singleChoice], [ascending]).outcomes["GRADE"]).toBe(0.5);
    });
  });

  test("a lookup inside a responseCondition branch executes like any rule", () => {
    const conditional: ResponseProcessingView = {
      rules: [
        {
          kind: "responseCondition",
          responseIf: {
            expression: { kind: "baseValue", baseType: "boolean", value: true },
            rules: [
              {
                kind: "lookupOutcomeValue",
                identifier: "GRADE",
                expression: { kind: "baseValue", baseType: "integer", value: 1 },
              },
            ],
          },
        },
      ],
    };

    expect(run(conditional, {}, [singleChoice], [grade]).outcomes["GRADE"]).toBe("A");
  });

  test("a declaration without a lookupTable refuses — never guesses (ADR-0003/0004)", () => {
    // §5.87 presumes "the lookupTable associated with the outcome's declaration";
    // with no table there is no spec-defined value to compute.
    const bare: OutcomeDeclarationView = { identifier: "GRADE", cardinality: "single", baseType: "identifier" };
    const result = run(intSource(1), {}, [singleChoice], [bare]);

    expect(result.issues[0]?.name).toBe("lookupOutcomeValue");
    expect(result.outcomes["GRADE"]).toBeNull();
  });

  test("the capability walk accepts the rule and inspects its expression", () => {
    expect(collectRpIssues(intSource(1))).toEqual([]);
    expect(collectRpIssues(lookup({ kind: "frobnicate" }))[0]?.name).toBe("frobnicate");
  });

  test("the capability walk reports a tableless declaration when declarations are supplied", () => {
    const bare: OutcomeDeclarationView = { identifier: "GRADE", cardinality: "single", baseType: "identifier" };

    expect(collectRpIssues(intSource(1), { outcomeDeclarations: [bare] })[0]?.name).toBe("lookupOutcomeValue");
    expect(collectRpIssues(intSource(1), { outcomeDeclarations: [grade] })).toEqual([]);
  });
});

describe("completionStatus (built-in outcome)", () => {
  // "There is one built-in outcome variable, 'completionStatus', that is declared
  // implicitly and must not appear in an outcome declaration. … It starts with the
  // reserved value 'not_attempted'. At the start of the first attempt it changes to
  // the reserved value 'unknown'. It remains with this value for the duration of the
  // item session unless set to a different value by a setOutcomeValue rule in
  // responseProcessing." (§2.2.2.3)
  const setCompleted: ResponseProcessingView = {
    rules: [
      {
        kind: "setOutcomeValue",
        identifier: "completionStatus",
        expression: { kind: "baseValue", baseType: "identifier", value: "completed" },
      },
    ],
  };

  test("implicitly declared: present without a declaration, defaulting to not_attempted", () => {
    const result = run({ rules: [] }, {});

    expect(result.outcomes["completionStatus"]).toBe("not_attempted");
  });

  test("the session's current value flows in through the context", () => {
    const result = executeResponseProcessing(
      { rules: [] },
      {
        responseDeclarations: [singleChoice],
        outcomeDeclarations: [scoreOutcome],
        responses: {},
        completionStatus: "unknown",
      },
    );

    expect(result.outcomes["completionStatus"]).toBe("unknown");
  });

  test("setOutcomeValue can set it without any declaration", () => {
    expect(collectRpIssues(setCompleted)).toEqual([]);
    expect(run(setCompleted, {}).outcomes["completionStatus"]).toBe("completed");
  });

  test("an explicit declaration keeps the declared behavior (legacy content)", () => {
    const declared: OutcomeDeclarationView = {
      identifier: "completionStatus",
      cardinality: "single",
      baseType: "identifier",
      defaultValue: { values: [{ value: "incomplete" }] },
    };
    const result = executeResponseProcessing(
      { rules: [] },
      {
        responseDeclarations: [singleChoice],
        outcomeDeclarations: [declared],
        responses: {},
        completionStatus: "unknown", // ignored when declared: the declaration wins
      },
    );

    expect(result.outcomes["completionStatus"]).toBe("incomplete");
  });
});

describe("test-context expressions stay refused at item level", () => {
  test("outcomeMinimum/outcomeMaximum can only be used in outcomes processing", () => {
    // "This expression, which can only be used in outcomes processing, …" (§2.11.2.6-7)
    const view = (kind: string): ResponseProcessingView => ({
      rules: [{ kind: "setOutcomeValue", identifier: "SCORE", expression: { kind, outcomeIdentifier: "SCORE" } }],
    });

    expect(collectRpIssues(view("outcomeMaximum"))[0]?.name).toBe("outcomeMaximum");
    expect(collectRpIssues(view("outcomeMinimum"))[0]?.name).toBe("outcomeMinimum");
  });
});

describe("responseProcessingFragment", () => {
  // "A responseProcessingFragment is a simple group of responseRules which are grouped
  // together in order to allow them to be managed as a separate resource." (§5.118)
  const totalOutcome: OutcomeDeclarationView = { identifier: "TOTAL", cardinality: "single", baseType: "float" };

  test("fragment rules execute inline, in order, over the same outcome state", () => {
    // Rule ordering (QTI 2.1, interpretive heritage): "Variables updated by a rule
    // take their new value when evaluated as part of any following rules."
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "TOTAL",
          expression: { kind: "baseValue", baseType: "float", value: 1 },
        },
        {
          kind: "responseProcessingFragment",
          rules: [
            {
              kind: "setOutcomeValue",
              identifier: "TOTAL",
              expression: {
                kind: "sum",
                expressions: [
                  { kind: "variable", identifier: "TOTAL" },
                  { kind: "baseValue", baseType: "float", value: 1 },
                ],
              },
            },
          ],
        },
      ],
    };
    const result = run(view, {}, [singleChoice], [totalOutcome]);

    expect(result.issues).toEqual([]);
    expect(result.outcomes["TOTAL"]).toBe(2);
  });

  test("fragments nest", () => {
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "responseProcessingFragment",
          rules: [
            {
              kind: "responseProcessingFragment",
              rules: [
                {
                  kind: "setOutcomeValue",
                  identifier: "TOTAL",
                  expression: { kind: "baseValue", baseType: "float", value: 3 },
                },
              ],
            },
          ],
        },
      ],
    };

    expect(run(view, {}, [singleChoice], [totalOutcome]).outcomes["TOTAL"]).toBe(3);
  });

  test("exitResponse inside a fragment ends the whole run", () => {
    const view: ResponseProcessingView = {
      rules: [
        {
          kind: "setOutcomeValue",
          identifier: "TOTAL",
          expression: { kind: "baseValue", baseType: "float", value: 1 },
        },
        { kind: "responseProcessingFragment", rules: [{ kind: "exitResponse" }] },
        {
          kind: "setOutcomeValue",
          identifier: "TOTAL",
          expression: { kind: "baseValue", baseType: "float", value: 9 },
        },
      ],
    };
    const result = run(view, {}, [singleChoice], [totalOutcome]);

    expect(result.issues).toEqual([]);
    expect(result.outcomes["TOTAL"]).toBe(1);
  });

  test("an empty fragment is a no-op", () => {
    const view: ResponseProcessingView = { rules: [{ kind: "responseProcessingFragment" }] };
    const result = run(view, {}, [singleChoice], [totalOutcome]);

    expect(result.issues).toEqual([]);
  });

  test("the capability walk recurses into fragment rules", () => {
    const view: ResponseProcessingView = {
      rules: [{ kind: "responseProcessingFragment", rules: [{ kind: "frobnicateRule" }] }],
    };
    const issues = collectRpIssues(view);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("frobnicateRule");
  });
});
