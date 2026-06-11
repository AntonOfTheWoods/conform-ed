/**
 * Reference Skin for `sliderInteraction` (ADR-0001): a controlled native range input
 * with a visible current value. Responses are stored as decimal strings; numeric
 * baseTypes compare numerically in scoring.
 */

import { createElement, type ChangeEvent, type ReactNode } from "react";

import type { BodyNode, InteractionRenderProps } from "../runtime";

interface SliderNodeView {
  prompt?: { content?: readonly BodyNode[] };
  lowerBound?: number;
  upperBound?: number;
  step?: number;
}

export function SliderReferenceSkin(props: InteractionRenderProps): ReactNode {
  const node = props.node as unknown as SliderNodeView;
  const lower = node.lowerBound ?? 0;
  const value = typeof props.value === "string" && props.value !== "" ? props.value : String(lower);

  return createElement(
    "div",
    { "data-qti-interaction": "sliderInteraction", "data-status": props.status },
    node.prompt ? createElement("div", { "data-qti-prompt": true }, props.renderContent(node.prompt.content)) : null,
    createElement("input", {
      type: "range",
      min: lower,
      max: node.upperBound ?? 100,
      step: node.step ?? 1,
      value,
      disabled: props.disabled,
      "aria-disabled": props.disabled,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        props.setValue(event.target.value);
      },
    }),
    createElement("output", null, props.value === null ? "—" : value),
  );
}
