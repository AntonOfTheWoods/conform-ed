import { createQti2Schemas } from "../v2-internal";

export const qti21Schemas = createQti2Schemas({
  includeAssessmentStimulus: false,
  includeExternalSupplementalAccessibility: false,
  includeScoringModes: false,
  manifestSchemaValues: ["QTIv2.1 Package", "QTIv2.1 Item Bank Package"],
  manifestResourceTypes: [
    "imsqti_test_xmlv2p1",
    "imsqti_section_xmlv2p1",
    "imsqti_item_xmlv2p1",
    "imsqti_resprocessing_xmlv2p1",
    "webcontent",
  ],
});
