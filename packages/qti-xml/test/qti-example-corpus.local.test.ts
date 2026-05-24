import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { expect, test } from "bun:test";

import { validateQtiXmlFile } from "../src";

const officialExamplesRoot = fileURLToPath(new URL("../../../tmp/qti-examples", import.meta.url));
const hasOfficialExamples = existsSync(officialExamplesRoot);
const corpusTest = hasOfficialExamples ? test : test.skip;

corpusTest("curated official examples validate with the current normalization slice", async () => {
  const files = [
    "qtiv2p2-examples/items/choice.xml",
    "qtiv2p2-examples/items/imsmanifest.xml",
    "qtiv3-examples/packaging/simple/choice.xml",
    "qtiv3-examples/tests/complete.xml",
    "qtiv3-examples/results/report.xml",
  ];

  const results = await Promise.all(files.map((file) => validateQtiXmlFile(path.join(officialExamplesRoot, file))));

  for (const result of results) {
    expect(result.status).toBe("valid");
  }
});

corpusTest("known broken official examples remain explicitly non-valid", async () => {
  const files = ["qtiv3-examples/CAT/test.xml", "qtiv3-examples/results/full-example.xml"];

  const results = await Promise.all(files.map((file) => validateQtiXmlFile(path.join(officialExamplesRoot, file))));

  expect(results[0]?.status).toBe("unsupported");
  expect(results[1]?.status).toBe("parse-error");
});
