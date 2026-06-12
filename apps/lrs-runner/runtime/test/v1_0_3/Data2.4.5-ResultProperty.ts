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

describe("Result Property Requirements (Data 2.4.5)", () => {
  /**  Matchup with Conformance Requirements Document
 * Data 2.4.5 Result
 * XAPI-00074 - in results.js
 * XAPI-00075 - in results.js
 * XAPI-00076 - in results.js
 * XAPI-00077 - in results.js
 * XAPI-00078 - in results.js

 * Data 2.4.5.1 Score
 * XAPI-00079 - in scores.js
 * XAPI-00080 - in scores.js
 * XAPI-00081 - in scores.js
 * XAPI-00082 - in scores.js
 * XAPI-00083 - in scores.js
 */
  templatingSelection.createTemplate("results.ts");
  templatingSelection.createTemplate("scores.ts");
});
