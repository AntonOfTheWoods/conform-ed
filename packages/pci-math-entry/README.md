# @conform-ed/pci-math-entry

The reference PCI for the conform-ed QTI stack: math entry with MathLive input and
compute-engine checking. It exists to be a real, end-to-end example of what a PCI
package looks like for consumers of `@conform-ed/qti-react` — interaction module,
pure checker, and response-processing operator, each on its own subpath.

## The response contract

The response of record is a PCI JSON record:

- `expression` — the learner's LaTeX, exactly as written. Always present.
- `verdict` — an **advisory** boolean computed client-side by the same checker the
  platform re-scores with. Present only when the item carries checker config
  (`data-correct`, optional `data-mode`, `data-tolerance`); a high-stakes delivery
  redacts those properties and the module degrades to expression-only. Unjudgeable
  input omits the verdict — never a guess.

Items score portably with plain QTI (`qti-field-value` over `verdict`); platforms
holding the expression re-score it server-side for the authoritative result.

## Subpaths

- `.` — checker, operator, module core (injectable input), type identifier.
- `./checker` — the pure function only (compute-engine; no qti-react, no DOM).
- `./operator` — `org.conform-ed.mathEquivalent` for `QtiRuntimeConfig.customOperators`.
- `./module` — the browser-ready module (MathLive + compute-engine). Heavy by design;
  load it lazily (ADR-0007: descriptors eager, implementations lazy):

```ts
const { mathEntryModule } = await import("@conform-ed/pci-math-entry/module");
registry.registerModule("math-entry", mathEntryModule);
```

## Checking modes

- `equivalent` (default) — symbolic equality, any mathematically equal form passes;
  optional absolute `tolerance` for float answers.
- `literal` — the written form matters (EqualComAss-style: `\frac{2}{4}` and `0.5`
  fail against `\frac{1}{2}`; reordered terms pass).

## Server-side re-scoring

The checker is a pure function — no adapters, usable from any API:

```ts
import { checkMathExpression } from "@conform-ed/pci-math-entry/checker";

Bun.serve({
  port: 3000,
  fetch: async (request) => {
    const { expression, correct, mode, tolerance } = await request.json();
    const result = checkMathExpression(expression, correct, { mode, tolerance });

    return Response.json(result); // { verdict: boolean | null, reason? }
  },
});
```
