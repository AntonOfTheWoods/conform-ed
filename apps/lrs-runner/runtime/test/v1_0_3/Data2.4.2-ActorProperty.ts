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
 * XAPI-00031 - in actors.js

 * 2.4.2.1 Actor is Agent - may have more in agents.js
 * XAPI-00032 - in agents.js
 * XAPI-00033 - in agents.js
 * XAPI-00034 - in agents.js

 * 2.4.2.2 Actor is Group
 * XAPI-00035 - in groups.js
 * XAPI-00036 - in groups.js
 * XAPI-00037 - in groups.js - multiple suites

 * 2.4.2.3 Inverse Function Identifier
 * XAPI-00038 - in ifis.js - two suites
 * XAPI-00039 - in ifis.js
 * XAPI-00040 - in ifis.js
 * XAPI-00041 - in ifis.js

 * 2.4.2.4 Account Object
 * XAPI-00042 - in accountobjects.js
 * XAPI-00043 - in accountobjects.js
 */

describe("Actor Property Requirements (Data 2.4.2)", () => {
  //Data 2.4.2
  templatingSelection.createTemplate("actors.ts");
  //Data 2.4.2.1
  templatingSelection.createTemplate("agents.ts");
  //Data 2.4.2.2
  templatingSelection.createTemplate("groups.ts");
  //Data 2.4.2.3
  templatingSelection.createTemplate("ifis.ts");
  //Data 2.4.2.4
  templatingSelection.createTemplate("accountobjects.ts");
});
