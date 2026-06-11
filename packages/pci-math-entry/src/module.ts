/**
 * The math-entry PCI module (IMS PCI v1 against the qti-react host contract). The
 * input widget is injected (`MathInputFactory`) so the module core stays testable and
 * DOM-library-free; the MathLive adapter lives in ./mathlive-input and the bundled
 * browser module in ./module-mathlive.
 *
 * Response of record (design decisions, BACKLOG #1): a PCI JSON record with the
 * learner's LaTeX `expression` plus an advisory `verdict` computed by the same pure
 * checker the platform re-scores with. The verdict exists only when the item carries
 * checker config (`correct`, optional `mode`/`tolerance` properties — authored as
 * data-* attributes); high-stakes deliveries redact those properties and the module
 * degrades to expression-only, leaving scoring entirely server-side. An unjudgeable
 * expression omits the verdict rather than guessing.
 */

import type { PciConfiguration, PciInstance, PciModule } from "@conform-ed/qti-react";

import { checkMathExpression } from "./checker";
import type { MathCheckMode, MathCheckOptions } from "./checker";

export const mathEntryTypeIdentifier = "urn:conform-ed:pci:math-entry";

export interface MathInputOptions {
  readonly initialLatex: string;
  readonly disabled?: boolean;
}

export interface MathInputHandle {
  readonly getValue: () => string;
  readonly setValue: (latex: string) => void;
  readonly destroy?: () => void;
}

/** Creates the actual input widget inside the module-owned container. */
export type MathInputFactory = (container: Element, options: MathInputOptions) => MathInputHandle;

interface MathEntryState {
  readonly expression?: string;
}

function restoredExpression(state: string | undefined): string {
  if (state === undefined || state === "") {
    return "";
  }

  try {
    const parsed = JSON.parse(state) as MathEntryState;

    return typeof parsed.expression === "string" ? parsed.expression : "";
  } catch {
    return "";
  }
}

function checkerOptions(properties: Readonly<Record<string, string>>): MathCheckOptions {
  const mode = properties["mode"];
  const tolerance = Number(properties["tolerance"]);

  return {
    ...(mode === "equivalent" || mode === "literal" ? { mode: mode as MathCheckMode } : {}),
    ...(properties["tolerance"] !== undefined && Number.isFinite(tolerance) ? { tolerance } : {}),
  };
}

export function createMathEntryModule(input: MathInputFactory): PciModule {
  return {
    typeIdentifier: mathEntryTypeIdentifier,

    getInstance(dom: Element, configuration: PciConfiguration, state: string | undefined): PciInstance {
      const properties = configuration.properties ?? {};
      const container = dom.ownerDocument.createElement("div");

      container.className = "math-entry-pci";
      dom.appendChild(container);

      const handle = input(container, { initialLatex: restoredExpression(state) });

      const instance: PciInstance = {
        typeIdentifier: mathEntryTypeIdentifier,

        getResponse(): unknown {
          const latex = handle.getValue().trim();
          const expressionEntry =
            latex === "" ? { name: "expression", base: null } : { name: "expression", base: { string: latex } };
          const correct = properties["correct"];

          if (latex === "" || correct === undefined) {
            return { record: [expressionEntry] };
          }

          const { verdict } = checkMathExpression(latex, correct, checkerOptions(properties));

          // A null verdict is unjudgeable input: omit the field, never guess.
          return verdict === null
            ? { record: [expressionEntry] }
            : { record: [expressionEntry, { name: "verdict", base: { boolean: verdict } }] };
        },

        getState(): string {
          return JSON.stringify({ expression: handle.getValue() });
        },

        oncompleted(): void {
          handle.destroy?.();
        },
      };

      configuration.onready?.(instance, state);

      return instance;
    },
  };
}
