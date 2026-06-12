/**
 * lookupTable evaluation for the `lookupOutcomeValue` rule (§5.87): "sets the value
 * of an outcome variable to the value obtained by looking up the value of the
 * associated expression in the lookupTable associated with the outcome's
 * declaration." Shared by the item interpreter and the test controller — the test's
 * own outcome declarations use the same view type.
 */

import type { OutcomeDeclarationView } from "./types";
import { coerceScalar, rpValue, singleNumber, type MaybeRpValue } from "./values";

export function hasLookupTable(declaration: OutcomeDeclarationView | undefined): declaration is OutcomeDeclarationView {
  return declaration?.matchTable !== undefined || declaration?.interpolationTable !== undefined;
}

/**
 * Look `source` up in the declaration's lookupTable. A NULL or non-numeric source is
 * read as "no matching table entry is found" (§5.90.1) — an interpretive call the
 * spec leaves open — so it takes the defaultValue path, never a refusal. "If
 * omitted, the NULL value is used." (§5.90.1/§5.78.1)
 */
export function lookupTableValue(declaration: OutcomeDeclarationView, source: MaybeRpValue): MaybeRpValue {
  const value = singleNumber(source);
  const table = declaration.matchTable ?? declaration.interpolationTable;
  const target = value === null ? undefined : matchedTarget(declaration, value);
  const result = target ?? table?.defaultValue;

  if (result === undefined) {
    return null;
  }

  return rpValue("single", [coerceScalar(result, declaration.baseType)], declaration.baseType);
}

function matchedTarget(declaration: OutcomeDeclarationView, value: number) {
  if (declaration.matchTable) {
    // "the first qti-match-table-entry with an exact match to the source" (§5.90)
    return declaration.matchTable.matchTableEntries.find((entry) => entry.sourceValue === value)?.targetValue;
  }

  // "the first interpolationTableEntry with a sourceValue that is less than or equal
  // to (subject to includeBoundary) the source value" (§5.78); document order decides.
  return declaration.interpolationTable?.interpolationTableEntries.find((entry) =>
    (entry.includeBoundary ?? true) ? entry.sourceValue <= value : entry.sourceValue < value,
  )?.targetValue;
}
