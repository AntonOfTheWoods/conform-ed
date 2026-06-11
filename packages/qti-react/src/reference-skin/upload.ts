/**
 * Reference Skin for `uploadInteraction` (ADR-0001): a native file input. The selected
 * file is stored as a data URL string (QTI `file` base type carries the content); items
 * using upload are typically scored externally, not by client response processing.
 */

import { createElement, type ChangeEvent, type ReactNode } from "react";

import type { BodyNode, InteractionRenderProps } from "../runtime";

interface UploadNodeView {
  prompt?: { content?: readonly BodyNode[] };
  /** Accepted MIME type, per the QTI `type` attribute. */
  type?: string;
}

export function UploadReferenceSkin(props: InteractionRenderProps): ReactNode {
  const node = props.node as unknown as UploadNodeView;

  return createElement(
    "div",
    { "data-qti-interaction": "uploadInteraction", "data-status": props.status },
    node.prompt ? createElement("div", { "data-qti-prompt": true }, props.renderContent(node.prompt.content)) : null,
    createElement("input", {
      type: "file",
      accept: node.type,
      disabled: props.disabled,
      "aria-disabled": props.disabled,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
          props.setValue(null);
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          props.setValue(typeof reader.result === "string" ? reader.result : null);
        };
        reader.readAsDataURL(file);
      },
    }),
  );
}
