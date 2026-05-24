import { createQti2Schemas } from "../v2-internal";

export const qti22Schemas = createQti2Schemas({
  includeAssessmentStimulus: true,
  includeExternalSupplementalAccessibility: true,
  includeScoringModes: true,
  manifestSchemaValues: ["QTIv2.2 Package", "QTIv2.2 Item Bank Package", "QTIv2.2 Object Bank Package"],
  manifestResourceTypes: [
    "imsqti_test_xmlv2p2",
    "imsqti_section_xmlv2p2",
    "imsqti_item_xmlv2p2",
    "imsqti_outcomes_xmlv2p2",
    "imsqti_stimulus_xmlv2p2",
    "imsqti_rptemplate_xmlv2p2",
    "imsqti_fragment_xmlv2p2",
    "imsqti_usagedata_xmlv2p2",
    "webcontent",
  ],
});
