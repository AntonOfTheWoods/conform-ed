/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory, RuntimeTemplatingSelection } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { expectAsync, endAsync } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

const helper = helperImport as RuntimeHelper;
const templatingSelection = templatingSelectionImport as RuntimeTemplatingSelection;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Authority Property Requirements (Data 2.4.9)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00098 - in authorities.js
   * XAPI-00099 - below
   * XAPI-00100 - below
   *
   * Note - XAPI-00024 - in authorities.js
   */
  templatingSelection.createTemplate("authorities.ts");

  /**  XAPI-00100, Data 2.4.9 Authority
   * An LRS rejects with error code 400 Bad Request, a Request whose "authority" is a Group having more than two Agents
   */
  it('An LRS rejects with error code 400 Bad Request, a Request whose "authority" is a Group and consists of non-O-Auth Agents (Data 2.4.9.s3.b3, XAPI-00100)', async function () {
    let templates = [
      { statement: "{{statements.default}}" },
      {
        authority: {
          objectType: "Group",
          name: "xAPI Group",
          mbox: "mailto:xapigroup@example.com",
          member: [
            { name: "agentA", mbox: "mailto:agentA@example.com" },
            { name: "agentB", mbox: "mailto:agentB@example.com" },
          ],
        },
      },
    ];
    let data = (helper.createFromTemplate(templates) as Record<string, unknown>)["statement"] as Statement;
    await expectAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json(data),
      400,
    );
  });

  /**  XAPI-00099, Data 2.4.9 Authority
   * An LRS populates the "authority" property if it is not provided in the Statement
   */
  describe('An LRS populates the "authority" property if it is not provided in the Statement, based on header information with the Agent corresponding to the user (contained within the header) (Implicit, Data 2.4.9.s3.b4, XAPI-00099) ', function () {
    it("should populate authority ", async function () {
      let templates = [{ statement: "{{statements.default}}" }];
      let data = (helper.createFromTemplate(templates) as Record<string, unknown>)["statement"] as Statement;
      data.id = helper.generateUUID();
      let query = "?statementId=" + data.id;
      let stmtTime = Date.now();

      await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data)
          .expect(200),
      );

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .headers(helper.addAllHeaders({}))
          .wait(helper.genDelay(stmtTime, query, data.id))
          .expect(200),
      );

      let statement = helper.parse(res.body as string, () => undefined) as Record<string, unknown>;
      expect(statement).toHaveProperty("authority");
    });
  });
});
