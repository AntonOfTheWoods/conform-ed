import type { ScoreResult } from "./types";

export interface EffectiveItemScore {
  readonly raw: number;
  readonly max: number;
  /** True when SCORE came from the RP outcomes of record rather than per-variable scoring. */
  readonly fromOutcomes: boolean;
}

function numericOutcome(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * The item score of record (QTI): a numeric SCORE outcome from response processing is
 * authoritative — PCI/RP-scored items (e.g. math-entry) have no per-variable
 * correctResponse basis, so their standard scores read 0. Summed per-variable standard
 * scoring is the fallback for items without RP. MAXSCORE follows the same precedence.
 *
 * Pure and framework-light: client and server (authoritative finalize) share it so the
 * grade of record is derived identically on both sides.
 */
export function effectiveItemScore(
  scores: readonly ScoreResult[],
  outcomes: Readonly<Record<string, unknown>>,
): EffectiveItemScore {
  const scoreOutcome = numericOutcome(outcomes["SCORE"]);
  const maxOutcome = numericOutcome(outcomes["MAXSCORE"]);
  const summedMax = scores.reduce((total, score) => total + score.maxScore, 0);

  if (scoreOutcome !== null) {
    return { raw: scoreOutcome, max: maxOutcome ?? summedMax, fromOutcomes: true };
  }

  return {
    raw: scores.reduce((total, score) => total + score.score, 0),
    max: maxOutcome ?? summedMax,
    fromOutcomes: false,
  };
}
