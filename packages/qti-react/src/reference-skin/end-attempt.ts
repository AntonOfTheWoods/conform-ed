/**
 * Reference Skin for `endAttemptInteraction` (ADR-0001): a titled button that sets its
 * boolean response true and ends the current attempt (hints, give-up, adaptive moves).
 */

import { createElement, type ReactNode } from "react";

import type { InteractionRenderProps } from "../runtime";

interface EndAttemptNodeView {
  title?: string;
}

export function EndAttemptReferenceSkin(props: InteractionRenderProps): ReactNode {
  const node = props.node as unknown as EndAttemptNodeView;

  return createElement(
    "button",
    {
      type: "button",
      disabled: props.disabled,
      "data-qti-interaction": "endAttemptInteraction",
      onClick: () => props.endAttempt(),
    },
    node.title ?? "End attempt",
  );
}
