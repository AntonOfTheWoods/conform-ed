/**
 * PIF (Package Interchange Format) ingestion: a QTI 3 content package is distributed
 * as a ZIP with imsmanifest.xml at its root. validateQtiPackageArchive validates the
 * package in-memory (no extraction to disk), reusing the same manifest + referenced-
 * document checks as the exploded-directory path. Fixtures are built in-memory with
 * fflate, so the tests touch no filesystem.
 */

import { expect, test } from "bun:test";

import { zipSync, strToU8 } from "fflate";

import { validateQtiPackageArchive } from "../src";

const asiHeader =
  'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

const choiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item ${asiHeader} identifier="item1" title="Item 1" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

function manifest(resourceXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-1">
  <metadata>
    <schema>QTI Package</schema>
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>
    ${resourceXml}
  </resources>
</manifest>`;
}

const itemResource = `<resource identifier="item1" type="imsqti_item_xmlv3p0" href="items/item1.xml">
      <file href="items/item1.xml"/>
    </resource>`;

test("a well-formed PIF archive validates", async () => {
  const zip = zipSync({
    "imsmanifest.xml": strToU8(manifest(itemResource)),
    "items/item1.xml": strToU8(choiceItem),
  });

  const result = await validateQtiPackageArchive(zip);

  expect(result.status).toBe("valid");
  expect(result.issues).toEqual([]);
  expect(result.referencedDocumentResults).toHaveLength(1);
  expect(result.referencedDocumentResults[0]?.status).toBe("valid");
});

test("an archive without imsmanifest.xml at the root is unsupported", async () => {
  const zip = zipSync({ "items/item1.xml": strToU8(choiceItem) });

  const result = await validateQtiPackageArchive(zip);

  expect(result.status).toBe("unsupported");
  expect(result.issues[0]?.message).toContain("imsmanifest.xml");
});

test("a manifest referencing a missing file is invalid", async () => {
  const zip = zipSync({ "imsmanifest.xml": strToU8(manifest(itemResource)) });

  const result = await validateQtiPackageArchive(zip);

  expect(result.status).toBe("invalid");
  expect(result.issues.some((issue) => issue.message.includes("items/item1.xml"))).toBe(true);
});

test("a referenced document that is itself invalid surfaces in the package result", async () => {
  const brokenItem = choiceItem.replace('identifier="item1"', "");
  const zip = zipSync({
    "imsmanifest.xml": strToU8(manifest(itemResource)),
    "items/item1.xml": strToU8(brokenItem),
  });

  const result = await validateQtiPackageArchive(zip);

  expect(result.status).toBe("invalid");
  expect(result.referencedDocumentResults[0]?.status).not.toBe("valid");
});

test("bytes that are not a ZIP archive are unsupported", async () => {
  const result = await validateQtiPackageArchive(strToU8("<not-a-zip/>"));

  expect(result.status).toBe("unsupported");
  expect(result.issues[0]?.message.toLowerCase()).toContain("zip");
});
