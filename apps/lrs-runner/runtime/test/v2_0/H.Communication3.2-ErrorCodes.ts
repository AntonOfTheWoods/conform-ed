/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import extend from "../../bun-runtime/extend-compat.ts";
import { describe, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { type RequestFactory } from "../super-request.ts";
import { expectAsync } from "../super-request.ts";

type QueryValue = string | number | boolean | undefined;

type StatementShape = {
  id: string;
  verb: {
    id: string;
  };
};

type TemplateResult = { statement: StatementShape } | Record<string, QueryValue>;

type ErrorCodesHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): TemplateResult;
  genDelay(stmtTime: number, query: string, statementId: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, QueryValue>): string;
};

const helper = helperImport as ErrorCodesHelper;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

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
      const templates = [{ statement: "{{statements.default}}" }];
      const statementContainer = helper.createFromTemplate(templates) as { statement: StatementShape };
      const data = statementContainer.statement;
      data.id = helper.generateUUID();

      const query = helper.getUrlEncoding({ StatementId: data.id });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .put(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });

    it('should fail on GET statement when not using "statementId"', async function () {
      const query = helper.getUrlEncoding({ StatementId: helper.generateUUID() });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "voidedStatementId"', async function () {
      const query = helper.getUrlEncoding({ VoidedStatementId: helper.generateUUID() });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "agent"', async function () {
      const templates = [{ Agent: "{{agents.default}}" }];
      const data = helper.createFromTemplate(templates) as Record<string, QueryValue>;

      const query = helper.getUrlEncoding(data);
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "verb"', async function () {
      const query = helper.getUrlEncoding({ Verb: "http://adlnet.gov/expapi/verbs/attended" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "activity"', async function () {
      const query = helper.getUrlEncoding({ Activity: "http://www.example.com/meetings/occurances/34534" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "registration"', async function () {
      const query = helper.getUrlEncoding({ Registration: "ec531277-b57b-4c15-8d91-d292c5b2b8f7" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "related_activities"', async function () {
      const query = helper.getUrlEncoding({ Related_Activities: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "related_agents"', async function () {
      const query = helper.getUrlEncoding({ Related_Agents: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "since"', async function () {
      const query = helper.getUrlEncoding({ Since: "2012-06-01T19:09:13.245Z" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "until"', async function () {
      const query = helper.getUrlEncoding({ Until: "2012-06-01T19:09:13.245Z" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "limit"', async function () {
      const query = helper.getUrlEncoding({ Limit: 10 });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "format"', async function () {
      const query = helper.getUrlEncoding({ Format: "ids" });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "attachments"', async function () {
      const query = helper.getUrlEncoding({ Attachments: true });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        400,
      );
    });

    it('should fail on GET statement when not using "ascending"', async function () {
      const query = helper.getUrlEncoding({ Ascending: true });
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
      const templates = [{ statement: "{{statements.default}}" }];
      const statementContainer = helper.createFromTemplate(templates) as { statement: StatementShape };
      const correct = statementContainer.statement;
      const incorrect = extend(true, {}, correct);

      correct.id = helper.generateUUID();
      incorrect.id = helper.generateUUID();

      incorrect.verb.id = "should fail";
      const query = "?statementId=" + correct.id;
      const stmtTime = Date.now();

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
