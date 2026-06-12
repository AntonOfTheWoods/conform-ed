/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

type AttachmentRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
};

type TemplateSelectionSupport = {
  createTemplate(templateName: string): void;
};

const helper = helperImport as AttachmentRequirementsHelper;
const templatingSelection = templatingSelectionImport as TemplateSelectionSupport;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Attachments Property Requirements (Data 2.4.11)", () => {
  /**  Matchup with Conformance Requirements Document
 * XAPI-00102 - in attachments.js
 * XAPI-00103 - in attachments.js
 * XAPI-00104 - in attachments.js
 * XAPI-00105 - in attachments.js
 * XAPI-00106 - in attachments.js
 * XAPI-00107 - in attachments.js

 * Note XAPI-00025 - in attachments.js
 */

  templatingSelection.createTemplate("attachments.ts");
});
