import type { QtiXmlElementNode, QtiXmlNode } from "./parse-xml";
import type { QtiSchemaSelectionKey, QtiVersion } from "./types";

const qtiV22DomainContentNames = new Set([
  "associateInteraction",
  "choiceInteraction",
  "customInteraction",
  "endAttemptInteraction",
  "extendedTextInteraction",
  "gap",
  "gapImg",
  "gapMatchInteraction",
  "gapText",
  "graphicAssociateInteraction",
  "graphicGapMatchInteraction",
  "graphicOrderInteraction",
  "hotspotChoice",
  "hotspotInteraction",
  "hotText",
  "hotTextInteraction",
  "inlineChoice",
  "inlineChoiceInteraction",
  "matchInteraction",
  "mediaInteraction",
  "orderInteraction",
  "positionObjectInteraction",
  "prompt",
  "selectPointInteraction",
  "simpleAssociableChoice",
  "simpleChoice",
  "sliderInteraction",
  "textEntryInteraction",
  "uploadInteraction",
]);

const qtiV30DomainContentNames = new Set([
  "qti-associate-interaction",
  "qti-choice-interaction",
  "qti-custom-interaction",
  "qti-drawing-interaction",
  "qti-end-attempt-interaction",
  "qti-extended-text-interaction",
  "qti-feedback-block",
  "qti-feedback-inline",
  "qti-gap",
  "qti-gap-img",
  "qti-gap-match-interaction",
  "qti-gap-text",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hot-text",
  "qti-hot-text-interaction",
  "qti-hotspot-choice",
  "qti-hotspot-interaction",
  "qti-include",
  "qti-inline-choice",
  "qti-inline-choice-interaction",
  "qti-match-interaction",
  "qti-media-interaction",
  "qti-order-interaction",
  "qti-position-object-interaction",
  "qti-printed-variable",
  "qti-prompt",
  "qti-rubric-block",
  "qti-select-point-interaction",
  "qti-simple-associable-choice",
  "qti-simple-choice",
  "qti-slider-interaction",
  "qti-template-block",
  "qti-template-inline",
  "qti-text-entry-interaction",
  "qti-upload-interaction",
]);

function normalizeTextValue(value: string): string | undefined {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function attributeBoolean(attributes: Record<string, string>, ...names: string[]): boolean | undefined {
  for (const name of names) {
    const value = attributes[name];
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return undefined;
}

function attributeNumber(attributes: Record<string, string>, ...names: string[]): number | undefined {
  for (const name of names) {
    const value = attributes[name];
    if (value === undefined) {
      continue;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function requireAttribute(element: QtiXmlElementNode, ...names: string[]): string {
  for (const name of names) {
    const value = element.attributes[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  throw new Error(`Missing required attribute on <${element.name}>: ${names.join(", ")}`);
}

function childElements(element: QtiXmlElementNode, localName?: string): QtiXmlElementNode[] {
  return element.children.filter(
    (child): child is QtiXmlElementNode =>
      child.type === "element" && (localName ? child.localName === localName : true),
  );
}

function firstChildElement(element: QtiXmlElementNode, localName: string): QtiXmlElementNode | undefined {
  return childElements(element, localName)[0];
}

function textContent(element: QtiXmlElementNode): string | undefined {
  const parts: string[] = [];

  for (const child of element.children) {
    if (child.type === "text") {
      const normalized = normalizeTextValue(child.value);
      if (normalized) {
        parts.push(normalized);
      }
      continue;
    }

    const nested = textContent(child);
    if (nested) {
      parts.push(nested);
    }
  }

  return parts.length ? parts.join(" ") : undefined;
}

function mapValueList(element: QtiXmlElementNode): Array<{ value: string }> {
  return childElements(element, "value").flatMap((valueElement) => {
    const value = textContent(valueElement);
    return value !== undefined ? [{ value }] : [];
  });
}

function mapV2ResponseDeclaration(element: QtiXmlElementNode) {
  const correctResponseElement = firstChildElement(element, "correctResponse");
  const defaultValueElement = firstChildElement(element, "defaultValue");

  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes.baseType,
    ...(correctResponseElement
      ? {
          correctResponse: {
            values: mapValueList(correctResponseElement),
          },
        }
      : {}),
    ...(defaultValueElement
      ? {
          defaultValue: {
            values: mapValueList(defaultValueElement),
          },
        }
      : {}),
  };
}

function mapV2OutcomeDeclaration(element: QtiXmlElementNode) {
  const defaultValueElement = firstChildElement(element, "defaultValue");

  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes.baseType,
    ...(defaultValueElement
      ? {
          defaultValue: {
            values: mapValueList(defaultValueElement),
          },
        }
      : {}),
    ...(element.attributes.interpretation ? { interpretation: element.attributes.interpretation } : {}),
    ...(element.attributes.longInterpretation ? { longInterpretation: element.attributes.longInterpretation } : {}),
    ...(attributeNumber(element.attributes, "normalMaximum") !== undefined
      ? { normalMaximum: attributeNumber(element.attributes, "normalMaximum") }
      : {}),
    ...(attributeNumber(element.attributes, "normalMinimum") !== undefined
      ? { normalMinimum: attributeNumber(element.attributes, "normalMinimum") }
      : {}),
    ...(attributeNumber(element.attributes, "masteryValue") !== undefined
      ? { masteryValue: attributeNumber(element.attributes, "masteryValue") }
      : {}),
  };
}

function mapV2ContentNodes(nodes: QtiXmlNode[]): unknown[] {
  const content: unknown[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const value = normalizeTextValue(node.value);
      if (value) {
        content.push({ kind: "text", value });
      }
      continue;
    }

    if (qtiV22DomainContentNames.has(node.localName)) {
      switch (node.localName) {
        case "prompt":
          content.push({
            kind: "prompt",
            children: mapV2ContentNodes(node.children),
          });
          break;
        case "simpleChoice":
          content.push({
            kind: "simpleChoice",
            identifier: requireAttribute(node, "identifier"),
            ...(attributeBoolean(node.attributes, "fixed") !== undefined
              ? { fixed: attributeBoolean(node.attributes, "fixed") }
              : {}),
            ...(node.attributes.showHide ? { showHide: node.attributes.showHide } : {}),
            ...(mapV2ContentNodes(node.children).length ? { children: mapV2ContentNodes(node.children) } : {}),
          });
          break;
        case "choiceInteraction":
        case "orderInteraction": {
          const prompt = firstChildElement(node, "prompt");
          const simpleChoices = childElements(node, "simpleChoice").map((choiceElement) => {
            const [mapped] = mapV2ContentNodes([choiceElement]);
            return mapped;
          });

          content.push({
            kind: node.localName,
            responseIdentifier: requireAttribute(node, "responseIdentifier"),
            ...(attributeBoolean(node.attributes, "shuffle") !== undefined
              ? { shuffle: attributeBoolean(node.attributes, "shuffle") }
              : {}),
            ...(attributeNumber(node.attributes, "maxChoices") !== undefined
              ? { maxChoices: attributeNumber(node.attributes, "maxChoices") }
              : {}),
            ...(attributeNumber(node.attributes, "minChoices") !== undefined
              ? { minChoices: attributeNumber(node.attributes, "minChoices") }
              : {}),
            ...(prompt ? { prompt: mapV2ContentNodes([prompt])[0] } : {}),
            simpleChoices,
          });
          break;
        }
        default:
          throw new Error(`Unsupported QTI 2.2 content element <${node.localName}> in normalization.`);
      }

      continue;
    }

    const children = mapV2ContentNodes(node.children);
    content.push({
      kind: node.localName,
      ...(Object.keys(node.attributes).length ? { attributes: node.attributes } : {}),
      ...(children.length ? { children } : {}),
    });
  }

  return content;
}

function mapV3ValueList(element: QtiXmlElementNode): Array<{ value: string }> {
  return childElements(element, "qti-value").flatMap((valueElement) => {
    const value = textContent(valueElement);
    return value !== undefined ? [{ value }] : [];
  });
}

function mapV3ResponseDeclaration(element: QtiXmlElementNode) {
  const correctResponseElement = firstChildElement(element, "qti-correct-response");
  const defaultValueElement = firstChildElement(element, "qti-default-value");

  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes["base-type"],
    ...(defaultValueElement
      ? {
          defaultValue: {
            values: mapV3ValueList(defaultValueElement),
          },
        }
      : {}),
    ...(correctResponseElement
      ? {
          correctResponse: {
            values: mapV3ValueList(correctResponseElement),
          },
        }
      : {}),
  };
}

function mapV3OutcomeDeclaration(element: QtiXmlElementNode) {
  const defaultValueElement = firstChildElement(element, "qti-default-value");

  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes["base-type"],
    ...(defaultValueElement
      ? {
          defaultValue: {
            values: mapV3ValueList(defaultValueElement),
          },
        }
      : {}),
    ...(element.attributes.interpretation ? { interpretation: element.attributes.interpretation } : {}),
    ...(element.attributes["long-interpretation"]
      ? { longInterpretation: element.attributes["long-interpretation"] }
      : {}),
    ...(attributeNumber(element.attributes, "normal-maximum") !== undefined
      ? { normalMaximum: attributeNumber(element.attributes, "normal-maximum") }
      : {}),
    ...(attributeNumber(element.attributes, "normal-minimum") !== undefined
      ? { normalMinimum: attributeNumber(element.attributes, "normal-minimum") }
      : {}),
    ...(attributeNumber(element.attributes, "mastery-value") !== undefined
      ? { masteryValue: attributeNumber(element.attributes, "mastery-value") }
      : {}),
  };
}

function mapV3XmlNode(element: QtiXmlElementNode): unknown {
  const children = mapV3ContentFragments(element.children);
  const textValue = textContent(element);

  return {
    kind: "xml",
    ...(element.namespaceUri ? { namespace: element.namespaceUri } : {}),
    name: element.localName,
    ...(Object.keys(element.attributes).length ? { attributes: element.attributes } : {}),
    ...(children.length ? { children } : {}),
    ...(children.length === 0 && textValue ? { value: textValue } : {}),
  };
}

function mapV3ContentFragments(nodes: QtiXmlNode[]): unknown[] {
  const content: unknown[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      const value = normalizeTextValue(node.value);
      if (value) {
        content.push(value);
      }
      continue;
    }

    if (qtiV30DomainContentNames.has(node.localName)) {
      switch (node.localName) {
        case "qti-prompt":
          content.push({
            kind: "prompt",
            content: mapV3ContentFragments(node.children),
          });
          break;
        case "qti-simple-choice":
          content.push({
            kind: "simpleChoice",
            identifier: requireAttribute(node, "identifier"),
            ...(attributeBoolean(node.attributes, "fixed") !== undefined
              ? { fixed: attributeBoolean(node.attributes, "fixed") }
              : {}),
            ...(node.attributes["template-identifier"]
              ? { templateIdentifier: node.attributes["template-identifier"] }
              : {}),
            ...(node.attributes["show-hide"] ? { showHide: node.attributes["show-hide"] } : {}),
            ...(mapV3ContentFragments(node.children).length ? { content: mapV3ContentFragments(node.children) } : {}),
          });
          break;
        case "qti-choice-interaction":
        case "qti-order-interaction": {
          const prompt = firstChildElement(node, "qti-prompt");
          const simpleChoices = childElements(node, "qti-simple-choice").map((choiceElement) => {
            const [mapped] = mapV3ContentFragments([choiceElement]);
            return mapped;
          });

          content.push({
            kind: node.localName === "qti-choice-interaction" ? "choiceInteraction" : "orderInteraction",
            responseIdentifier: requireAttribute(node, "response-identifier"),
            ...(attributeBoolean(node.attributes, "shuffle") !== undefined
              ? { shuffle: attributeBoolean(node.attributes, "shuffle") }
              : {}),
            ...(attributeNumber(node.attributes, "max-choices") !== undefined
              ? { maxChoices: attributeNumber(node.attributes, "max-choices") }
              : {}),
            ...(attributeNumber(node.attributes, "min-choices") !== undefined
              ? { minChoices: attributeNumber(node.attributes, "min-choices") }
              : {}),
            ...(node.attributes.orientation ? { orientation: node.attributes.orientation } : {}),
            ...(prompt ? { prompt: mapV3ContentFragments([prompt])[0] } : {}),
            simpleChoices,
          });
          break;
        }
        default:
          throw new Error(`Unsupported QTI 3.0.1 content element <${node.localName}> in normalization.`);
      }

      continue;
    }

    content.push(mapV3XmlNode(node));
  }

  return content;
}

function mapV3Expression(element: QtiXmlElementNode): unknown {
  switch (element.localName) {
    case "qti-base-value":
      return {
        kind: "baseValue",
        baseType: requireAttribute(element, "base-type"),
        value: textContent(element) ?? "",
      };
    case "qti-variable":
      return {
        kind: "variable",
        identifier: requireAttribute(element, "identifier"),
      };
    case "qti-match": {
      const expressions = childElements(element).map((child) => mapV3Expression(child));
      return {
        kind: "match",
        children: expressions,
      };
    }
    default:
      throw new Error(`Unsupported QTI 3.0.1 expression element <${element.localName}> in normalization.`);
  }
}

function mapV3PreCondition(element: QtiXmlElementNode) {
  const expressionElement = childElements(element)[0];
  if (!expressionElement) {
    throw new Error("<qti-pre-condition> must contain an expression.");
  }

  return {
    kind: "preCondition",
    expression: mapV3Expression(expressionElement),
  };
}

function mapV3ItemSessionControl(element: QtiXmlElementNode) {
  return {
    ...(attributeBoolean(element.attributes, "allow-review") !== undefined
      ? { allowReview: attributeBoolean(element.attributes, "allow-review") }
      : {}),
    ...(attributeNumber(element.attributes, "max-attempts") !== undefined
      ? { maxAttempts: attributeNumber(element.attributes, "max-attempts") }
      : {}),
    ...(attributeBoolean(element.attributes, "show-feedback") !== undefined
      ? { showFeedback: attributeBoolean(element.attributes, "show-feedback") }
      : {}),
    ...(attributeBoolean(element.attributes, "show-solution") !== undefined
      ? { showSolution: attributeBoolean(element.attributes, "show-solution") }
      : {}),
    ...(attributeBoolean(element.attributes, "allow-comment") !== undefined
      ? { allowComment: attributeBoolean(element.attributes, "allow-comment") }
      : {}),
    ...(attributeBoolean(element.attributes, "allow-skipping") !== undefined
      ? { allowSkipping: attributeBoolean(element.attributes, "allow-skipping") }
      : {}),
    ...(attributeBoolean(element.attributes, "validate-responses") !== undefined
      ? { validateResponses: attributeBoolean(element.attributes, "validate-responses") }
      : {}),
  };
}

function mapV3TimeLimits(element: QtiXmlElementNode) {
  return {
    ...(attributeNumber(element.attributes, "min-time") !== undefined
      ? { minTime: attributeNumber(element.attributes, "min-time") }
      : {}),
    ...(attributeNumber(element.attributes, "max-time") !== undefined
      ? { maxTime: attributeNumber(element.attributes, "max-time") }
      : {}),
    ...(attributeBoolean(element.attributes, "allow-late-submission") !== undefined
      ? { allowLateSubmission: attributeBoolean(element.attributes, "allow-late-submission") }
      : {}),
  };
}

function mapV3AssessmentItemRef(element: QtiXmlElementNode) {
  return {
    identifier: requireAttribute(element, "identifier"),
    href: requireAttribute(element, "href"),
    ...(attributeBoolean(element.attributes, "required") !== undefined
      ? { required: attributeBoolean(element.attributes, "required") }
      : {}),
    ...(attributeBoolean(element.attributes, "fixed") !== undefined
      ? { fixed: attributeBoolean(element.attributes, "fixed") }
      : {}),
  };
}

function mapV3AssessmentSection(element: QtiXmlElementNode): unknown {
  const children = childElements(element).flatMap((child) => {
    switch (child.localName) {
      case "qti-assessment-item-ref":
        return [mapV3AssessmentItemRef(child)];
      case "qti-assessment-section":
        return [mapV3AssessmentSection(child)];
      case "qti-pre-condition":
      case "qti-branch-rule":
      case "qti-item-session-control":
      case "qti-time-limits":
        return [];
      default:
        throw new Error(`Unsupported QTI 3.0.1 assessment section child <${child.localName}> in normalization.`);
    }
  });

  return {
    identifier: requireAttribute(element, "identifier"),
    title: requireAttribute(element, "title"),
    visible: attributeBoolean(element.attributes, "visible") ?? true,
    ...(attributeBoolean(element.attributes, "required") !== undefined
      ? { required: attributeBoolean(element.attributes, "required") }
      : {}),
    ...(attributeBoolean(element.attributes, "fixed") !== undefined
      ? { fixed: attributeBoolean(element.attributes, "fixed") }
      : {}),
    ...(attributeBoolean(element.attributes, "keep-together") !== undefined
      ? { keepTogether: attributeBoolean(element.attributes, "keep-together") }
      : {}),
    ...(childElements(element, "qti-pre-condition").length
      ? { preConditions: childElements(element, "qti-pre-condition").map((child) => mapV3PreCondition(child)) }
      : {}),
    ...(firstChildElement(element, "qti-item-session-control")
      ? { itemSessionControl: mapV3ItemSessionControl(firstChildElement(element, "qti-item-session-control")!) }
      : {}),
    ...(firstChildElement(element, "qti-time-limits")
      ? { timeLimits: mapV3TimeLimits(firstChildElement(element, "qti-time-limits")!) }
      : {}),
    ...(children.length ? { children } : {}),
  };
}

function mapV3ResultValues(element: QtiXmlElementNode): Array<{ value: string }> {
  return childElements(element, "value").map((valueElement) => ({
    value: textContent(valueElement) ?? "",
  }));
}

function mapV3ResultResponseVariable(element: QtiXmlElementNode) {
  const candidateResponseElement = firstChildElement(element, "candidateResponse");
  const correctResponseElement = firstChildElement(element, "correctResponse");

  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes.baseType,
    candidateResponse: {
      values: candidateResponseElement ? mapV3ResultValues(candidateResponseElement) : [],
    },
    ...(correctResponseElement
      ? {
          correctResponse: {
            values: mapV3ResultValues(correctResponseElement),
          },
        }
      : {}),
    ...(element.attributes.choiceSequence
      ? { choiceSequence: element.attributes.choiceSequence.split(/\s+/u).filter(Boolean) }
      : {}),
    ...(element.attributes.scoreStatus ? { scoreStatus: element.attributes.scoreStatus } : {}),
    ...(element.attributes.answeredStatus ? { answeredStatus: element.attributes.answeredStatus } : {}),
  };
}

function mapV3ResultOutcomeVariable(element: QtiXmlElementNode) {
  return {
    identifier: requireAttribute(element, "identifier"),
    cardinality: requireAttribute(element, "cardinality"),
    baseType: element.attributes.baseType,
    values: mapV3ResultValues(element),
    ...(attributeNumber(element.attributes, "masteryValue") !== undefined
      ? { masteryValue: attributeNumber(element.attributes, "masteryValue") }
      : {}),
  };
}

function mapV3ResultContext(element: QtiXmlElementNode) {
  return {
    ...(element.attributes.sourcedId ? { sourcedId: element.attributes.sourcedId } : {}),
    ...(childElements(element, "sessionIdentifier").length
      ? {
          sessionIdentifiers: childElements(element, "sessionIdentifier").map((sessionIdentifier) => ({
            sourceId: requireAttribute(sessionIdentifier, "sourceID", "sourceId"),
            identifier: requireAttribute(sessionIdentifier, "identifier"),
          })),
        }
      : {}),
  };
}

function mapV3TestResult(element: QtiXmlElementNode) {
  return {
    identifier: requireAttribute(element, "identifier"),
    datestamp: requireAttribute(element, "datestamp"),
    ...(childElements(element, "responseVariable").length
      ? {
          responseVariables: childElements(element, "responseVariable").map((variable) =>
            mapV3ResultResponseVariable(variable),
          ),
        }
      : {}),
    ...(childElements(element, "outcomeVariable").length
      ? {
          outcomeVariables: childElements(element, "outcomeVariable").map((variable) =>
            mapV3ResultOutcomeVariable(variable),
          ),
        }
      : {}),
  };
}

function mapV3ItemResult(element: QtiXmlElementNode) {
  return {
    identifier: requireAttribute(element, "identifier"),
    datestamp: requireAttribute(element, "datestamp"),
    sessionStatus: requireAttribute(element, "sessionStatus"),
    ...(attributeNumber(element.attributes, "sequenceIndex") !== undefined
      ? { sequenceIndex: attributeNumber(element.attributes, "sequenceIndex") }
      : {}),
    ...(childElements(element, "responseVariable").length
      ? {
          responseVariables: childElements(element, "responseVariable").map((variable) =>
            mapV3ResultResponseVariable(variable),
          ),
        }
      : {}),
    ...(childElements(element, "outcomeVariable").length
      ? {
          outcomeVariables: childElements(element, "outcomeVariable").map((variable) =>
            mapV3ResultOutcomeVariable(variable),
          ),
        }
      : {}),
  };
}

function normalizeQti22AssessmentItem(root: QtiXmlElementNode) {
  return {
    assessmentItem: {
      identifier: requireAttribute(root, "identifier"),
      ...(root.attributes.title ? { title: root.attributes.title } : {}),
      ...(attributeBoolean(root.attributes, "adaptive") !== undefined
        ? { adaptive: attributeBoolean(root.attributes, "adaptive") }
        : {}),
      ...(attributeBoolean(root.attributes, "timeDependent") !== undefined
        ? { timeDependent: attributeBoolean(root.attributes, "timeDependent") }
        : {}),
      responseDeclarations: childElements(root, "responseDeclaration").map((element) =>
        mapV2ResponseDeclaration(element),
      ),
      outcomeDeclarations: childElements(root, "outcomeDeclaration").map((element) => mapV2OutcomeDeclaration(element)),
      ...(firstChildElement(root, "itemBody")
        ? {
            itemBody: {
              children: mapV2ContentNodes(firstChildElement(root, "itemBody")!.children),
            },
          }
        : {}),
    },
  };
}

function normalizeQti22Manifest(root: QtiXmlElementNode) {
  const metadataElement = firstChildElement(root, "metadata");
  if (!metadataElement) {
    throw new Error("<manifest> must contain <metadata>.");
  }

  return {
    manifest: {
      identifier: requireAttribute(root, "identifier"),
      metadata: {
        schema: textContent(firstChildElement(metadataElement, "schema") ?? metadataElement) ?? "",
        schemaVersion: textContent(firstChildElement(metadataElement, "schemaversion") ?? metadataElement) ?? "",
      },
      organizations: {},
      resources: childElements(firstChildElement(root, "resources") ?? root, "resource").map((resourceElement) => ({
        identifier: requireAttribute(resourceElement, "identifier"),
        type: requireAttribute(resourceElement, "type"),
        ...(resourceElement.attributes.href ? { href: resourceElement.attributes.href } : {}),
        ...(childElements(resourceElement, "file").length
          ? {
              files: childElements(resourceElement, "file").map((fileElement) => ({
                href: requireAttribute(fileElement, "href"),
              })),
            }
          : {}),
        ...(childElements(resourceElement, "dependency").length
          ? {
              dependencies: childElements(resourceElement, "dependency").map((dependencyElement) => ({
                identifierRef: requireAttribute(dependencyElement, "identifierref"),
              })),
            }
          : {}),
      })),
    },
  };
}

function normalizeQti301AssessmentItem(root: QtiXmlElementNode) {
  return {
    assessmentItem: {
      identifier: requireAttribute(root, "identifier"),
      title: requireAttribute(root, "title"),
      timeDependent: attributeBoolean(root.attributes, "time-dependent") ?? false,
      ...(attributeBoolean(root.attributes, "adaptive") !== undefined
        ? { adaptive: attributeBoolean(root.attributes, "adaptive") }
        : {}),
      responseDeclarations: childElements(root, "qti-response-declaration").map((element) =>
        mapV3ResponseDeclaration(element),
      ),
      outcomeDeclarations: childElements(root, "qti-outcome-declaration").map((element) =>
        mapV3OutcomeDeclaration(element),
      ),
      ...(firstChildElement(root, "qti-item-body")
        ? {
            itemBody: {
              content: mapV3ContentFragments(firstChildElement(root, "qti-item-body")!.children),
            },
          }
        : {}),
      ...(firstChildElement(root, "qti-response-processing")
        ? {
            responseProcessing: {
              ...(firstChildElement(root, "qti-response-processing")!.attributes.template
                ? { template: firstChildElement(root, "qti-response-processing")!.attributes.template }
                : {}),
              ...(firstChildElement(root, "qti-response-processing")!.attributes["template-location"]
                ? {
                    templateLocation: firstChildElement(root, "qti-response-processing")!.attributes[
                      "template-location"
                    ],
                  }
                : {}),
            },
          }
        : {}),
    },
  };
}

function normalizeQti301AssessmentTest(root: QtiXmlElementNode) {
  return {
    assessmentTest: {
      identifier: requireAttribute(root, "identifier"),
      title: requireAttribute(root, "title"),
      outcomeDeclarations: childElements(root, "qti-outcome-declaration").map((element) =>
        mapV3OutcomeDeclaration(element),
      ),
      ...(firstChildElement(root, "qti-time-limits")
        ? { timeLimits: mapV3TimeLimits(firstChildElement(root, "qti-time-limits")!) }
        : {}),
      testParts: childElements(root, "qti-test-part").map((testPart) => ({
        identifier: requireAttribute(testPart, "identifier"),
        navigationMode: requireAttribute(testPart, "navigation-mode"),
        submissionMode: requireAttribute(testPart, "submission-mode"),
        ...(firstChildElement(testPart, "qti-item-session-control")
          ? { itemSessionControl: mapV3ItemSessionControl(firstChildElement(testPart, "qti-item-session-control")!) }
          : {}),
        ...(firstChildElement(testPart, "qti-time-limits")
          ? { timeLimits: mapV3TimeLimits(firstChildElement(testPart, "qti-time-limits")!) }
          : {}),
        children: childElements(testPart)
          .filter((child) => child.localName === "qti-assessment-section")
          .map((section) => mapV3AssessmentSection(section)),
      })),
    },
  };
}

function normalizeQti301AssessmentResult(root: QtiXmlElementNode) {
  return {
    assessmentResult: {
      ...(firstChildElement(root, "context")
        ? { context: mapV3ResultContext(firstChildElement(root, "context")!) }
        : { context: {} }),
      ...(firstChildElement(root, "testResult")
        ? { testResult: mapV3TestResult(firstChildElement(root, "testResult")!) }
        : {}),
      ...(childElements(root, "itemResult").length
        ? { itemResults: childElements(root, "itemResult").map((itemResult) => mapV3ItemResult(itemResult)) }
        : {}),
    },
  };
}

export function normalizeQtiDocument(
  version: QtiVersion,
  schemaSelectionKey: QtiSchemaSelectionKey,
  root: QtiXmlElementNode,
): unknown {
  switch (`${version}:${schemaSelectionKey}`) {
    case "2.2:qtiAssessmentItemDocument":
      return normalizeQti22AssessmentItem(root);
    case "2.2:qtiManifestDocument":
      return normalizeQti22Manifest(root);
    case "3.0.1:qtiAssessmentItemDocument":
      return normalizeQti301AssessmentItem(root);
    case "3.0.1:qtiAssessmentTestDocument":
      return normalizeQti301AssessmentTest(root);
    case "3.0.1:qtiAssessmentResultDocument":
      return normalizeQti301AssessmentResult(root);
    default:
      throw new Error(`Normalization is not implemented for ${version} ${schemaSelectionKey}.`);
  }
}
