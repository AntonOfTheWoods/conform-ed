/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { endAsync } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";
import type { RuntimeHelper, RuntimeRequestFactory, RuntimeTemplatingSelection } from "../harness-types.ts";
import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";

const helper = helperImport as RuntimeHelper;
const templatingSelection = templatingSelectionImport as RuntimeTemplatingSelection;
let request: RuntimeRequestFactory = requestBase;

/**  As there is no Data 2.4 file, I will match them up here
 * Matchup with Conformance Requirements Document
 * XAPI-00021 - these are all in Multiplicity folder, the community said this won't be a problem and do not test it.  some are also covered in templating tests, usually in these cases post and 200 or 400.
 * XAPI-00022 - in timestamp_property.js
 * XAPI-00023 - in Data 2.4.8 Stored Property
 * XAPI-00024 - in authorities.js
 * XAPI-00025 - in attachments.js
 */

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

/** Matchup with Conformance Requirements Document
 * XAPI-00026 - found below
 * XAPI-00027 - in uuids.js
 * XAPI-00028 - in uuids.js
 * XAPI-00029 - in uuids.js
 * XAPI-00030 - in uuids.js
 */

describe("Id Property Requirements (Data 2.4.1)", () => {
  let data: Statement;

  templatingSelection.createTemplate("uuids.ts");

  /**  XAPI-00026,  Data 2.4.1 Id
   * An LRS generates the "id" property of a Statement if none is provided (Modify, 4.1.1.a)
   */
  describe('An LRS generates the "id" property of a Statement if none is provided (Modify, Data 2.4.1.s2.b1, XAPI-00026)', function () {
    it("should complete an empty id property", async function () {
      let stmtid: string;
      let query: string;
      let templates = [{ statement: "{{statements.default}}" }];
      data = (helper.createFromTemplate(templates) as Record<string, unknown>)["statement"] as Statement;
      let stmtTime = Date.now();

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data)
          .expect(200),
      );

      stmtid = (res.body as string[])[0] as string;
      query = "?statementId=" + stmtid;
      const res2 = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .wait(helper.genDelay(stmtTime, query, stmtid))
          .headers(helper.addAllHeaders({})),
      );

      let results = helper.parse(res2.body as string, () => undefined) as Record<string, unknown>;
      expect(results["id"]).not.toBeUndefined();
      expect(results["id"]).toEqual(stmtid);
    });
  });
});
