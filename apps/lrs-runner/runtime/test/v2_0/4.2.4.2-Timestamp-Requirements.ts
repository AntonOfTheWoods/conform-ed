/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

type TimestampRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
};

type TemplateSelectionSupport = {
  createTemplate(templateName: string): void;
};

const helper = helperImport as TimestampRequirementsHelper;
const templatingSelection = templatingSelectionImport as TemplateSelectionSupport;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Timestamp Property Requirements (Data 2.4.7)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00022 - in timestamp_property.js
   */

  templatingSelection.createTemplate("timestamp_property.ts");
});
