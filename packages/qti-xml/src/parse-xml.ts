import { XMLParser, XMLValidator } from "fast-xml-parser";

export interface QtiXmlTextNode {
  type: "text";
  value: string;
}

export interface QtiXmlElementNode {
  type: "element";
  name: string;
  localName: string;
  prefix?: string;
  namespaceUri?: string;
  attributes: Record<string, string>;
  children: QtiXmlNode[];
}

export type QtiXmlNode = QtiXmlElementNode | QtiXmlTextNode;

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "#text",
  commentPropName: "#comment",
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
});

function splitXmlName(name: string): { localName: string; prefix?: string } {
  const [prefix, localName] = name.includes(":") ? name.split(":", 2) : [undefined, name];
  return {
    prefix,
    localName: localName ?? name,
  };
}

function parseValidationError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Invalid XML.";
  }

  const candidate = error as { err?: { msg?: string } };
  return candidate.err?.msg ?? JSON.stringify(error);
}

function buildNamespaceScope(
  parentScope: Record<string, string>,
  attributes: Record<string, string>,
): Record<string, string> {
  const nextScope = { ...parentScope };

  for (const [name, value] of Object.entries(attributes)) {
    if (name === "xmlns") {
      nextScope[""] = value;
      continue;
    }

    if (name.startsWith("xmlns:")) {
      nextScope[name.slice("xmlns:".length)] = value;
    }
  }

  return nextScope;
}

function stripNamespaceAttributes(attributes: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributes).filter(([name]) => name !== "xmlns" && !name.startsWith("xmlns:")),
  );
}

function buildXmlNodes(entries: unknown, parentScope: Record<string, string>): QtiXmlNode[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const nodes: QtiXmlNode[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;

    const textValue = record["#text"];
    if (
      (typeof textValue === "string" || typeof textValue === "number" || typeof textValue === "boolean") &&
      !Array.isArray(textValue)
    ) {
      nodes.push({
        type: "text",
        value: String(textValue),
      });
      continue;
    }

    const elementName = Object.keys(record).find((key) => key !== ":@" && key !== "#comment" && !key.startsWith("?"));

    if (!elementName) {
      continue;
    }

    const rawAttributes = record[":@"];
    const attributes =
      rawAttributes && typeof rawAttributes === "object"
        ? Object.fromEntries(
            Object.entries(rawAttributes as Record<string, unknown>).map(([name, value]) => [name, String(value)]),
          )
        : {};
    const namespaceScope = buildNamespaceScope(parentScope, attributes);
    const strippedAttributes = stripNamespaceAttributes(attributes);
    const { localName, prefix } = splitXmlName(elementName);

    nodes.push({
      type: "element",
      name: elementName,
      localName,
      prefix,
      namespaceUri: prefix ? namespaceScope[prefix] : namespaceScope[""],
      attributes: strippedAttributes,
      children: buildXmlNodes(record[elementName], namespaceScope),
    });
  }

  return nodes;
}

export function parseXmlDocument(xml: string): QtiXmlElementNode {
  const validationResult = XMLValidator.validate(xml);
  if (validationResult !== true) {
    throw new Error(parseValidationError(validationResult));
  }

  const nodes = buildXmlNodes(parser.parse(xml), {});
  const root = nodes.find((node) => node.type === "element");

  if (!root || root.type !== "element") {
    throw new Error("XML document does not contain a root element.");
  }

  return root;
}
