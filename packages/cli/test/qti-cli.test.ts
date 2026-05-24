import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  formatQtiCoverageReport,
  formatQtiFolderValidationSummary,
  formatQtiInventorySummary,
  formatQtiPackageValidationResult,
  formatQtiValidationResult,
  qtiCoverageReportCommand,
  qtiInventoryExamplesCommand,
  qtiValidateFileCommand,
  qtiValidateFolderCommand,
  qtiValidatePackageCommand,
} from "../src";

const createdDirectories: string[] = [];

const qti22ChoiceItemXml = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="choice" title="Choice" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>ChoiceA</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <prompt>Pick the correct answer.</prompt>
      <simpleChoice identifier="ChoiceA">A</simpleChoice>
      <simpleChoice identifier="ChoiceB">B</simpleChoice>
    </choiceInteraction>
  </itemBody>
</assessmentItem>
`;

async function createTempFixtureDir(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "conform-ed-cli-qti-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

test("QTI CLI helpers inventory and validate supported files", async () => {
  const directory = await createTempFixtureDir();
  const itemPath = path.join(directory, "qtiv2p2-examples", "items", "choice.xml");
  const brokenPath = path.join(directory, "qtiv3-examples", "CAT", "test.xml");

  await mkdir(path.dirname(itemPath), { recursive: true });
  await mkdir(path.dirname(brokenPath), { recursive: true });
  await Promise.all([
    writeFile(itemPath, qti22ChoiceItemXml, "utf8"),
    writeFile(brokenPath, "<!DOCTYPE html><html><body>broken</body></html>", "utf8"),
  ]);

  const inventory = await qtiInventoryExamplesCommand(directory);
  const fileValidation = await qtiValidateFileCommand(itemPath);
  const folderValidation = await qtiValidateFolderCommand(directory);
  const coverage = await qtiCoverageReportCommand(directory);

  expect(inventory.summary.bySupportStatus.supported).toBe(1);
  expect(fileValidation.status).toBe("valid");
  expect(folderValidation.valid).toBe(1);
  expect(folderValidation.skipped).toBe(1);
  expect(coverage.bySchema[0]?.schemaSelectionKey).toBe("qtiAssessmentItemDocument");
  expect(formatQtiInventorySummary(inventory)).toContain("supported=1");
  expect(formatQtiValidationResult(fileValidation)).toContain("Status: valid");
  expect(formatQtiFolderValidationSummary(folderValidation)).toContain("Validated XML files: 1");
  expect(formatQtiCoverageReport(coverage)).toContain("qtiAssessmentItemDocument: total=1");
});

test("QTI package validation validates exploded packages with a root manifest", async () => {
  const directory = await createTempFixtureDir();
  const packageDirectory = path.join(directory, "package");
  const manifestPath = path.join(packageDirectory, "imsmanifest.xml");
  const itemPath = path.join(packageDirectory, "choice.xml");

  await mkdir(packageDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      manifestPath,
      `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" identifier="manifest-1">
  <metadata>
    <schema>QTIv2.2 Package</schema>
    <schemaversion>1.0.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>
    <resource identifier="choice" type="imsqti_item_xmlv2p2" href="choice.xml">
      <file href="choice.xml"/>
    </resource>
  </resources>
</manifest>
`,
      "utf8",
    ),
    writeFile(itemPath, qti22ChoiceItemXml, "utf8"),
  ]);

  const result = await qtiValidatePackageCommand(packageDirectory);

  expect(result.status).toBe("valid");
  expect(result.referencedDocumentResults).toHaveLength(1);
  expect(formatQtiPackageValidationResult(result)).toContain("Status: valid");
});
