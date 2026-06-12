/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory, RuntimeTemplatingSelection } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { endAsync } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

const helper = helperImport as RuntimeHelper;
const templatingSelection = templatingSelectionImport as RuntimeTemplatingSelection;
let request: RuntimeRequestFactory = requestBase;

const REG_ALLOWED_VERSIONS = /^2\.0\.0$|^1\.0(\.[1-3])$/;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Version Property Requirements (Data 2.4.10)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00101 - in version.js
   * Unnumbered test - came from XAPI-00332
   */

  templatingSelection.createTemplate("version.ts");

  /**  XAPI-00332, Communication 3.3 Versioning which should be moved to Data 2.4.10 Version Property
   * Statements returned by an LRS MUST retain the version property they are accepted with.
   */
  it("Statements returned by an LRS MUST retain the version property they are accepted with (Format, Data 2.4.10, XAPI-00332)", async function () {
    let stmtTime = Date.now();

    let statementTemplates = [{ statement: "{{statements.default}}" }];

    let version = "1.0.3";
    let id = helper.generateUUID();

    let statement = (helper.createFromTemplate(statementTemplates) as Record<string, unknown>)[
      "statement"
    ] as Statement;
    statement.id = id;
    statement.version = version;

    let query = helper.getUrlEncoding({ statementId: id });

    await endAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json(statement)
        .expect(200),
    );

    const res = await endAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .wait(helper.genDelay(stmtTime, "?" + query, id))
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    let results = helper.parse(res.body as string, () => undefined) as Record<string, unknown>;
    expect(results["version"]).toMatch(REG_ALLOWED_VERSIONS);
  });
});
