/**
 * Root coverage beyond items/tests/stimuli/results: "The exchange of a single
 * qti-assessment-section instance is permitted", response-processing templates are
 * exchanged standalone ("qti-response-processing - … enables the exchange of
 * best-practice response processing templates"), qti-outcome-declaration is its own
 * root, QTI metadata has its own binding, and Usage Data & Item Statistics is its
 * own specification with corpus instances. Each test validates end-to-end (parse →
 * normalize → strict contracts schema).
 */

import { expect, test } from "bun:test";
import path from "node:path";

import { validateQtiXmlContent, validateQtiXmlFile } from "../src";

const corpusRoot = path.resolve(import.meta.dir, "../../../tmp/qti-examples");

test("a corpus response-processing template normalizes standalone", async () => {
  const result = await validateQtiXmlFile(
    path.join(corpusRoot, "qtiv3-examples/packaging/maxfiles/rptemplates/match_correct.xml"),
  );

  expect(result.issues).toEqual([]);
  expect(result.status).toBe("valid");

  const document = result.normalizedDocument as { responseProcessing: { rules: unknown[] } };

  expect(document.responseProcessing.rules.length).toBeGreaterThan(0);
});

test("all corpus response-processing templates normalize", async () => {
  const templates = [
    "qtiv3-examples/packaging/maxfiles/rptemplates/match_correct.xml",
    "qtiv3-examples/packaging/maxfiles/rptemplates/map_response.xml",
    "qtiv3-examples/packaging/ccPackage/rptemplates/CC2_map_response.xml",
    "qtiv3-examples/packaging/ccPackage/rptemplates/CC2_match.xml",
    "qtiv3-examples/packaging/ccPackage/rptemplates/CC2_match_basic.xml",
  ];

  for (const template of templates) {
    const result = await validateQtiXmlFile(path.join(corpusRoot, template));

    expect([template, result.status]).toEqual([template, "valid"]);
  }
});

test("the corpus standalone qti-outcome-declaration normalizes", async () => {
  const result = await validateQtiXmlFile(
    path.join(corpusRoot, "qtiv3-examples/packaging/CASEWithOutcome/testoutcome01.xml"),
  );

  expect(result.issues).toEqual([]);
  expect(result.status).toBe("valid");
  expect(result.normalizedDocument).toEqual({
    outcomeDeclaration: {
      identifier: "SCORE",
      cardinality: "single",
      baseType: "float",
      defaultValue: { values: [{ value: "0.0" }] },
    },
  });
});

test("a standalone qti-assessment-section document normalizes", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="S1" title="Standalone" visible="true">
  <qti-assessment-item-ref identifier="I1" href="items/i1.xml"/>
</qti-assessment-section>
`;

  const result = await validateQtiXmlContent(xml);

  expect(result.issues).toEqual([]);
  expect(result.status).toBe("valid");

  const document = result.normalizedDocument as { assessmentSection: Record<string, unknown> };

  expect(document.assessmentSection["identifier"]).toBe("S1");
  expect(document.assessmentSection["children"]).toEqual([{ identifier: "I1", href: "items/i1.xml" }]);
});

test("a standalone qti-outcome-processing document normalizes", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-outcome-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-set-outcome-value identifier="TOTAL">
    <qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum>
  </qti-set-outcome-value>
</qti-outcome-processing>
`;

  const result = await validateQtiXmlContent(xml);

  expect(result.issues).toEqual([]);
  expect(result.status).toBe("valid");

  const document = result.normalizedDocument as { outcomeProcessing: { rules: unknown[] } };

  expect(document.outcomeProcessing.rules).toHaveLength(1);
});

test("a qtiMetadata document normalizes its camelCase binding", async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qtiMetadata xmlns="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0">
  <itemTemplate>false</itemTemplate>
  <timeDependent>false</timeDependent>
  <composite>true</composite>
  <interactionType>choiceInteraction</interactionType>
  <interactionType>textEntryInteraction</interactionType>
  <feedbackType>nonadaptive</feedbackType>
  <solutionAvailable>true</solutionAvailable>
  <scoringMode>responseprocessing</scoringMode>
  <toolName>XMLSPY</toolName>
  <toolVersion>5.4</toolVersion>
  <toolVendor>ALTOVA</toolVendor>
</qtiMetadata>
`;

  const result = await validateQtiXmlContent(xml);

  expect(result.issues).toEqual([]);
  expect(result.status).toBe("valid");
  expect(result.normalizedDocument).toEqual({
    qtiMetadata: {
      itemTemplate: false,
      timeDependent: false,
      composite: true,
      interactionType: ["choiceInteraction", "textEntryInteraction"],
      feedbackType: "nonadaptive",
      solutionAvailable: true,
      scoringMode: ["responseprocessing"],
      toolName: "XMLSPY",
      toolVersion: "5.4",
      toolVendor: "ALTOVA",
    },
  });
});

test("all corpus usage data instances normalize (Usage Data & Item Statistics)", async () => {
  const instances = [
    "qtiv3-examples/usageData/example.xml",
    "qtiv3-examples/packaging/usageData/USAGE-MALE-TEST-106391.xml",
    "qtiv3-examples/packaging/usageData/USAGE-FEMALE-TEST-106391.xml",
    "qtiv3-examples/packaging/usageData/USAGE-TOTAL-TEST-106391.xml",
  ];

  for (const instance of instances) {
    const result = await validateQtiXmlFile(path.join(corpusRoot, instance));

    expect([instance, result.issues.slice(0, 1), result.status]).toEqual([instance, [], "valid"]);
  }
});

test("usage data statistics map their target objects, values, and mappings", async () => {
  const result = await validateQtiXmlFile(path.join(corpusRoot, "qtiv3-examples/usageData/example.xml"));
  const document = result.normalizedDocument as {
    usageData: { statistics: Array<Record<string, unknown>> };
  };

  const first = document.usageData.statistics[0]!;

  expect(first["kind"]).toBe("ordinaryStatistic");
  expect(first["name"]).toBe("AIS");
  expect(first["context"]).toBe("http://ntweb.ets.org/itemStats/Context/XVZ2004_J1B");
  expect(first["caseCount"]).toBe(689325);
  expect(first["stdError"]).toBe(0.0022);
  expect(first["lastUpdated"]).toBe("2004-07-04");
  expect(first["targetObjects"]).toEqual([{ identifier: "Item_VB123456" }]);
  expect(first["value"]).toEqual({ value: "0.87" });
});
