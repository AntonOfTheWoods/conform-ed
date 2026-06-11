/**
 * The response store the headless core owns (ADR-0001): it holds candidate responses
 * keyed by `responseIdentifier`, the submitted flag, and the scored outcomes. Skins are
 * controlled against it; they never own response state (only ephemeral UI state).
 *
 * Backed by an external store so `useSyncExternalStore` can subscribe with narrow,
 * snapshot-stable reads. No React import here — the hook lives in the runtime.
 */

import { scoreResponse } from "./response-processing";
import { executeResponseProcessing } from "./rp";
import type { OutcomeDeclarationView, OutcomeValue, ResponseNormalization, ResponseProcessingView } from "./rp";
import type { ResponseDeclarationView, ResponseValue, ScoreResult } from "./types";

export interface AttemptSnapshot {
  readonly responses: Readonly<Record<string, ResponseValue>>;
  readonly submitted: boolean;
  /** Per-response heuristic results backing the per-interaction feedback chrome. */
  readonly scores: readonly ScoreResult[];
  /** Item outcomes of record from the RP interpreter; empty before submit or without RP. */
  readonly outcomes: Readonly<Record<string, OutcomeValue>>;
}

export interface AttemptStoreOptions {
  readonly outcomeDeclarations?: readonly OutcomeDeclarationView[];
  readonly responseProcessing?: ResponseProcessingView;
  /** The Response Normalization hook (ADR-0004); applies to scores and outcomes alike. */
  readonly normalization?: ResponseNormalization;
}

export interface AttemptStore {
  // Function-property signatures (not methods): these are bound arrow functions, safe to
  // pass by reference (e.g. to useSyncExternalStore).
  readonly getSnapshot: () => AttemptSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly setResponse: (responseIdentifier: string, value: ResponseValue) => void;
  readonly submit: () => readonly ScoreResult[];
  readonly reset: () => void;
}

export function createAttemptStore(
  declarations: readonly ResponseDeclarationView[],
  initialResponses: Readonly<Record<string, ResponseValue>>,
  options?: AttemptStoreOptions,
): AttemptStore {
  const declarationsById = new Map(declarations.map((declaration) => [declaration.identifier, declaration]));
  const listeners = new Set<() => void>();

  let snapshot: AttemptSnapshot = {
    responses: { ...initialResponses },
    submitted: false,
    scores: [],
    outcomes: {},
  };

  function emit(next: AttemptSnapshot): void {
    snapshot = next;

    for (const listener of listeners) {
      listener();
    }
  }

  function computeScores(responses: Readonly<Record<string, ResponseValue>>): readonly ScoreResult[] {
    return [...declarationsById.values()].map((declaration) =>
      scoreResponse(declaration, responses[declaration.identifier] ?? null, options?.normalization),
    );
  }

  function computeOutcomes(responses: Readonly<Record<string, ResponseValue>>): Readonly<Record<string, OutcomeValue>> {
    if (!options?.responseProcessing) {
      return {};
    }

    return executeResponseProcessing(options.responseProcessing, {
      responseDeclarations: declarations,
      outcomeDeclarations: options.outcomeDeclarations ?? [],
      responses,
      normalization: options.normalization,
    }).outcomes;
  }

  // Arrow-function properties: inherently bound, so they can be passed by reference
  // (e.g. to useSyncExternalStore) without `this` hazards.
  return {
    getSnapshot: () => snapshot,

    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    setResponse: (responseIdentifier, value) => {
      if (snapshot.submitted) {
        return;
      }

      emit({
        ...snapshot,
        responses: { ...snapshot.responses, [responseIdentifier]: value },
      });
    },

    submit: () => {
      const scores = computeScores(snapshot.responses);
      const outcomes = computeOutcomes(snapshot.responses);

      emit({ ...snapshot, submitted: true, scores, outcomes });

      return scores;
    },

    reset: () => {
      emit({ responses: { ...initialResponses }, submitted: false, scores: [], outcomes: {} });
    },
  };
}
