/**
 * Structural views of QTI 3 `responseProcessing` and `outcomeDeclaration` (ADR-0004).
 * Like the rest of the runtime's views, these are narrowed shapes of the
 * `@conform-ed/contracts` schemas: validation happens upstream, the interpreter works
 * against these types and reports anything it does not understand via the Capability
 * Report instead of guessing.
 */

import type { CapabilityIssue } from "../capability";
import type { Cardinality, ResponseDeclarationView, ResponseValue } from "../types";

export type RpScalar = string | number | boolean;

/** An outcome variable's value as exposed to consumers after response processing. */
export type OutcomeValue = RpScalar | readonly RpScalar[] | null;

export interface OutcomeDeclarationView {
  readonly identifier: string;
  readonly cardinality: Cardinality;
  readonly baseType?: string;
  readonly defaultValue?: { readonly values: ReadonlyArray<{ readonly value: RpScalar }> };
}

/**
 * One expression node. Deliberately loose (`kind: string`): kinds the interpreter
 * does not implement yet flow through and surface as `unsupported-rp` issues.
 */
export interface RpExpressionView {
  readonly kind: string;
  readonly identifier?: string;
  readonly baseType?: string;
  readonly value?: RpScalar;
  readonly expressions?: readonly RpExpressionView[];
}

export interface RpConditionBranch {
  readonly expression: RpExpressionView;
  readonly rules: readonly RpRuleView[];
}

/** One response rule: responseCondition, setOutcomeValue, or exitResponse. */
export interface RpRuleView {
  readonly kind: string;
  readonly identifier?: string;
  readonly expression?: RpExpressionView;
  readonly responseIf?: RpConditionBranch;
  readonly responseElseIfs?: readonly RpConditionBranch[];
  readonly responseElse?: { readonly rules: readonly RpRuleView[] };
}

/** Either a standard-template URI or an explicit rule tree (rules win if both). */
export interface ResponseProcessingView {
  readonly template?: string;
  readonly rules?: readonly RpRuleView[];
}

/**
 * Response Normalization (ADR-0004): an opt-in, consumer-configured transform of
 * candidate string input applied at comparison time. Off by default; always off in
 * conformance runs. Applied to both sides of string comparisons so keys and candidate
 * input normalize identically.
 */
export type ResponseNormalization = (value: string, declaration?: ResponseDeclarationView) => string;

export interface ResponseProcessingContext {
  readonly responseDeclarations: readonly ResponseDeclarationView[];
  readonly outcomeDeclarations: readonly OutcomeDeclarationView[];
  readonly responses: Readonly<Record<string, ResponseValue>>;
  readonly normalization?: ResponseNormalization;
}

export interface ResponseProcessingResult {
  readonly outcomes: Readonly<Record<string, OutcomeValue>>;
  /** Non-empty means execution aborted to declared defaults (never partial scoring). */
  readonly issues: readonly CapabilityIssue[];
}
