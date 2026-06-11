/**
 * Reference Skin for `mediaInteraction` (ADR-0001): renders the wrapped audio/video
 * element itself (skin-owned, so it can count plays), resolving the source through the
 * runtime's Asset Resolver. The response is the play count as an integer string;
 * playback is blocked once `maxPlays` is reached.
 */

import { createElement, type ReactNode, type SyntheticEvent } from "react";

import type { BodyNode, InteractionRenderProps, XmlContentNode } from "../runtime";

interface MediaNodeView {
  prompt?: { content?: readonly BodyNode[] };
  maxPlays?: number;
  loop?: boolean;
  content?: readonly BodyNode[];
}

function findMediaElement(nodes: readonly BodyNode[] | undefined): XmlContentNode | null {
  for (const node of nodes ?? []) {
    if (node.kind === "xml") {
      const xmlNode = node as XmlContentNode;

      if (xmlNode.name === "audio" || xmlNode.name === "video") {
        return xmlNode;
      }

      const nested = findMediaElement(xmlNode.children);

      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function MediaReferenceSkin(props: InteractionRenderProps): ReactNode {
  const node = props.node as unknown as MediaNodeView;
  const media = findMediaElement(node.content);
  const plays = typeof props.value === "string" ? Number(props.value) || 0 : 0;
  const playsExhausted = node.maxPlays !== undefined && node.maxPlays > 0 && plays >= node.maxPlays;

  if (!media) {
    return createElement(
      "div",
      { "data-qti-interaction": "mediaInteraction", "data-status": props.status },
      "No media element.",
    );
  }

  const src = typeof media.attributes?.["src"] === "string" ? props.resolveAsset(media.attributes["src"]) : undefined;

  return createElement(
    "div",
    { "data-qti-interaction": "mediaInteraction", "data-status": props.status, "data-qti-plays": plays },
    node.prompt ? createElement("div", { "data-qti-prompt": true }, props.renderContent(node.prompt.content)) : null,
    createElement(media.name, {
      src,
      controls: true,
      loop: node.loop ?? false,
      onPlay: (event: SyntheticEvent<HTMLMediaElement>) => {
        if (props.disabled || playsExhausted) {
          event.currentTarget.pause();
          return;
        }

        props.setValue(String(plays + 1));
      },
    }),
    playsExhausted ? createElement("p", { role: "status" }, "No plays remaining.") : null,
  );
}
