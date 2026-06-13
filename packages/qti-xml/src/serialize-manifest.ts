/**
 * QTI 3 content-package manifest + qtiMetadata XML serialization — the export
 * direction of the packaging binding (imscp_v1p1) and the metadata binding
 * (imsqti_metadata_v3p0). Inverse of normalizeQti301Manifest / mapV3QtiMetadata;
 * IEEE LOM rides through as a structurally preserved foreign-XML node. Gated by the
 * corpus model round trip.
 */

import { XmlWriter, type AttributeValue } from "./xml-writer";

const manifestNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";
const metadataNamespace = "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0";

type Node = Record<string, unknown>;
type Attrs = ReadonlyArray<readonly [string, AttributeValue]>;

function asNode(value: unknown): Node {
  return (value ?? {}) as Node;
}

function str(node: Node, key: string): string | undefined {
  const value = node[key];
  return typeof value === "string" ? value : undefined;
}

function nodes(node: Node, key: string): Node[] {
  const value = node[key];
  return Array.isArray(value) ? value.map((entry) => asNode(entry)) : [];
}

function texts(node: Node, key: string): string[] {
  const value = node[key];
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function boolText(node: Node, key: string): string | undefined {
  const value = node[key];
  return typeof value === "boolean" ? String(value) : undefined;
}

/** A foreign-XML node (the preserved LOM): redeclare its namespace and recurse. */
function writeForeignNode(writer: XmlWriter, node: Node, ambient: string): void {
  const name = str(node, "name") ?? "span";
  const namespace = str(node, "namespace");
  const attributes: Array<readonly [string, AttributeValue]> = Object.entries(
    (node["attributes"] ?? {}) as Record<string, string>,
  );

  let childAmbient = ambient;
  if (namespace !== undefined && namespace !== ambient) {
    attributes.push(["xmlns", namespace]);
    childAmbient = namespace;
  }

  const children = node["children"];
  if (Array.isArray(children) && children.length) {
    writer.element(name, attributes, () => {
      for (const child of children) {
        if (typeof child === "string") {
          writer.text(child);
        } else {
          writeForeignNode(writer, asNode(child), childAmbient);
        }
      }
    });
    return;
  }

  const value = str(node, "value");
  if (value !== undefined) {
    writer.element(name, attributes, value);
    return;
  }

  writer.element(name, attributes);
}

/** The qtiMetadata camelCase binding, shared by manifests and standalone documents. */
function writeQtiMetadataBody(writer: XmlWriter, metadata: Node): void {
  const itemTemplate = boolText(metadata, "itemTemplate");
  if (itemTemplate !== undefined) {
    writer.element("itemTemplate", [], itemTemplate);
  }
  const timeDependent = boolText(metadata, "timeDependent");
  if (timeDependent !== undefined) {
    writer.element("timeDependent", [], timeDependent);
  }
  const composite = boolText(metadata, "composite");
  if (composite !== undefined) {
    writer.element("composite", [], composite);
  }
  for (const interactionType of texts(metadata, "interactionType")) {
    writer.element("interactionType", [], interactionType);
  }
  const pciContext = metadata["portableCustomInteractionContext"];
  if (pciContext) {
    const context = asNode(pciContext);
    writer.element("portableCustomInteractionContext", [], () => {
      const customTypeIdentifier = str(context, "customTypeIdentifier");
      if (customTypeIdentifier !== undefined) {
        writer.element("customTypeIdentifier", [], customTypeIdentifier);
      }
      const interactionKind = str(context, "interactionKind");
      if (interactionKind !== undefined) {
        writer.element("interactionKind", [], interactionKind);
      }
    });
  }
  const feedbackType = str(metadata, "feedbackType");
  if (feedbackType !== undefined) {
    writer.element("feedbackType", [], feedbackType);
  }
  const solutionAvailable = boolText(metadata, "solutionAvailable");
  if (solutionAvailable !== undefined) {
    writer.element("solutionAvailable", [], solutionAvailable);
  }
  for (const scoringMode of texts(metadata, "scoringMode")) {
    writer.element("scoringMode", [], scoringMode);
  }
  const toolName = str(metadata, "toolName");
  if (toolName !== undefined) {
    writer.element("toolName", [], toolName);
  }
  const toolVersion = str(metadata, "toolVersion");
  if (toolVersion !== undefined) {
    writer.element("toolVersion", [], toolVersion);
  }
  const toolVendor = str(metadata, "toolVendor");
  if (toolVendor !== undefined) {
    writer.element("toolVendor", [], toolVendor);
  }
}

/** The qtiMetadata + LOM pair carried by manifest and resource metadata. */
function writeResourceMetadataBody(writer: XmlWriter, metadata: Node, ambient: string): void {
  const qtiMetadata = metadata["qtiMetadata"];
  if (qtiMetadata) {
    writer.element("qtiMetadata", [], () => writeQtiMetadataBody(writer, asNode(qtiMetadata)));
  }
  const lom = metadata["lom"];
  if (lom) {
    writeForeignNode(writer, asNode(lom), ambient);
  }
}

/** Serialize a standalone qtiMetadata document. */
export function serializeQtiMetadata(document: unknown): string {
  const metadata = asNode(asNode(document)["qtiMetadata"]);
  const writer = new XmlWriter();
  writer.line('<?xml version="1.0" encoding="UTF-8"?>');

  writer.element(
    "qtiMetadata",
    [
      ["xmlns", metadataNamespace],
      ["xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance"],
    ],
    () => writeQtiMetadataBody(writer, metadata),
  );

  return writer.toString();
}

/** Serialize a QTI 3 content-package manifest. */
export function serializeQtiManifest(document: unknown): string {
  const manifest = asNode(asNode(document)["manifest"]);
  const metadata = asNode(manifest["metadata"]);
  const writer = new XmlWriter();
  writer.line('<?xml version="1.0" encoding="UTF-8"?>');

  const rootAttributes: Attrs = [
    ["xmlns", manifestNamespace],
    ["xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance"],
    ["identifier", str(manifest, "identifier")],
  ];

  writer.element("manifest", rootAttributes, () => {
    writer.element("metadata", [], () => {
      writer.element("schema", [], str(metadata, "schema") ?? "");
      writer.element("schemaversion", [], str(metadata, "schemaVersion") ?? "");
      writeResourceMetadataBody(writer, metadata, manifestNamespace);
    });

    writer.element("organizations", []);

    writer.element("resources", [], () => {
      for (const resource of nodes(manifest, "resources")) {
        writer.element(
          "resource",
          [
            ["identifier", str(resource, "identifier")],
            ["type", str(resource, "type")],
            ["href", str(resource, "href")],
          ],
          () => {
            const resourceMetadata = resource["metadata"];
            if (resourceMetadata) {
              writer.element("metadata", [], () =>
                writeResourceMetadataBody(writer, asNode(resourceMetadata), manifestNamespace),
              );
            }
            for (const file of nodes(resource, "files")) {
              writer.element("file", [["href", str(file, "href")]]);
            }
            for (const dependency of nodes(resource, "dependencies")) {
              writer.element("dependency", [["identifierref", str(dependency, "identifierRef")]]);
            }
          },
        );
      }
    });
  });

  return writer.toString();
}
