/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import extend from "../../bun-runtime/extend-compat.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { expectAsync } from "../super-request.ts";
import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";
import type { RuntimeRequestFactory } from "../harness-types.ts";

import { describe, it } from "../bun-test.ts";

type TemplateValue = string | number | boolean | { [key: string]: TemplateValue } | TemplateValue[];
type QueryValue = string | number | boolean | undefined;

type ErrorCodesHelper = {
  OAuthRequest(request: RuntimeRequestFactory): RuntimeRequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): Record<string, TemplateValue>;
  genDelay(stmtTime: number, query?: string, statementId?: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, QueryValue>): string;
};

const helper = helperImport as ErrorCodesHelper;
let request: RuntimeRequestFactory = requestBase;
if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

function createStatementFromTemplate(templates: Array<Record<string, string>>): Statement {
  return helper.createFromTemplate(templates)["statement"] as Statement;
}

describe("Error Codes Requirements (Communication 3.2)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00323 - not found yet - An LRS can only reject Statements using the error codes in this specification - what are we to test here??
   * XAPI-00324 - below
   * XAPI-00325 - below
   * XAPI-00326 - below
   * XAPI-00327 - not found yet - An LRS rejects a Statement of insufficient permissions (credentials are valid, but not adequate) with error code 403 Forbidden
   * XAPI-00328 - below
   * XAPI-00329 - not found yet - An LRS rejects a Statement due to network/server issues with an error code of 500 Internal Server Error
   */

  /**  XAPI-00324, Communication 3.2 Error Codes
   * An LRS rejects with error code 400 Bad Request any request to an API which uses a parameter not recognized by the LRS
   */
  it("An LRS rejects with error code 400 Bad Request any request to an Resource which uses a parameter not recognized by the LRS (Communication 3.2.s2.b1, XAPI-00324)", async function () {
    await expectAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?foo=bar")
        .headers(helper.addAllHeaders({})),
      400,
    );
  });

  /**  XAPI-00325, Communication 3.2 Error Codes
   * An LRS rejects with error code 400 Bad Request any request to an API which uses a parameter with differing case
   */
  describe("An LRS rejects with error code 400 Bad Request any request to an Resource which uses a parameter with differing case (Communication 3.2.s3.b8, XAPI-00325)", function () {
    it('should fail on PUT statement when not using "statementId"', async function () {
      let templates = [{ statement: "{{statements.default}}" }];
      let data = createStatementFromTemplate(templates);
      data.id = helper.generateUUID();

      let query = helper.getUrlEncoding({ StatementId: data.id });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .put(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });

    it('should fail on GET statement when not using "statementId"', async function () {
      let query = helper.getUrlEncoding({ StatementId: helper.generateUUID() });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "voidedStatementId"', async function () {
      let query = helper.getUrlEncoding({ VoidedStatementId: helper.generateUUID() });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "agent"', async function () {
      let templates = [{ Agent: "{{agents.default}}" }];
      let data = helper.createFromTemplate(templates) as Record<string, QueryValue>;

      let query = helper.getUrlEncoding(data);
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "verb"', async function () {
      let query = helper.getUrlEncoding({ Verb: "http://adlnet.gov/expapi/verbs/attended" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "activity"', async function () {
      let query = helper.getUrlEncoding({ Activity: "http://www.example.com/meetings/occurances/34534" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "registration"', async function () {
      let query = helper.getUrlEncoding({ Registration: "ec531277-b57b-4c15-8d91-d292c5b2b8f7" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "related_activities"', async function () {
      let query = helper.getUrlEncoding({ Related_Activities: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "related_agents"', async function () {
      let query = helper.getUrlEncoding({ Related_Agents: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "since"', async function () {
      let query = helper.getUrlEncoding({ Since: "2012-06-01T19:09:13.245Z" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "until"', async function () {
      let query = helper.getUrlEncoding({ Until: "2012-06-01T19:09:13.245Z" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "limit"', async function () {
      let query = helper.getUrlEncoding({ Limit: 10 });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "format"', async function () {
      let query = helper.getUrlEncoding({ Format: "ids" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "attachments"', async function () {
      let query = helper.getUrlEncoding({ Attachments: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "ascending"', async function () {
      let query = helper.getUrlEncoding({ Ascending: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });
  });

  /**  XAPI-00326, Communication 3.2 Error Codes
   * An LRS rejects with a 400 Bad Request any batch of Statements in which one or more Statements is rejected and if necessary, restores the LRS to the state in which it was before the batch began processing. The response may identify the first statementId which failed.
   */
  describe("An LRS does not process any batch of Statements in which one or more Statements is rejected and if necessary, restores the LRS to the state in which it was before the batch began processing (Communication 3.2.s3.b9, XAPI-00326, **Implicit**)", function () {
    it("should not persist any statements on a single failure", async function () {
      let templates = [{ statement: "{{statements.default}}" }];
      let correct = createStatementFromTemplate(templates);
      let incorrect = extend(true, {}, correct);

      correct.id = helper.generateUUID();
      incorrect.id = helper.generateUUID();

      incorrect.verb.id = "should fail";
      let query = "?statementId=" + correct.id;
      let stmtTime = Date.now();

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json([correct, incorrect]),
        400,
      );

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?statementId=" + correct.id)
          .wait(helper.genDelay(stmtTime, query, correct.id))
          .headers(helper.addAllHeaders({})),
        404,
      );
    });
  });

  /**  XAPI-00328, Communication 3.2 Error Codes
   * An LRS rejects a Statement due to size if the Statement exceeds the size limit the LRS is configured to with error code 413 Request Entity Too Large.
   * Held out for now. No upper limit constraint.
   */
});
