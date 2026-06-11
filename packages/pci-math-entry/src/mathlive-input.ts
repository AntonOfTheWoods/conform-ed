/**
 * The MathLive input adapter: a <math-field> custom element inside the module-owned
 * container. Importing this file registers the element and pulls MathLive's full
 * bundle — browser-only and heavy by design; consumers reach it through the ./module
 * subpath via lazy import() (ADR-0007: descriptors eager, implementations lazy).
 */

import { MathfieldElement } from "mathlive";

import type { MathInputFactory } from "./module";

export const mathLiveInput: MathInputFactory = (container, options) => {
  const field = new MathfieldElement();

  field.value = options.initialLatex;

  if (options.disabled === true) {
    field.readOnly = true;
  }

  container.appendChild(field);

  return {
    getValue: () => field.value,
    setValue: (latex) => {
      field.value = latex;
    },
    destroy: () => {
      field.remove();
    },
  };
};
