/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory, RuntimeTemplatingSelection } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";
const helper = helperImport as RuntimeHelper;
const templatingSelection = templatingSelectionImport as RuntimeTemplatingSelection;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

/**  Matchup with Conformance Requirements Document
 * XAPI-00044 - in verbs.js - two suites
 * XAPI-00045 - in verbs.js
 */

describe("Verb Property Requirements (Data 2.4.3)", () => {
  templatingSelection.createTemplate("verbs.ts");
});
