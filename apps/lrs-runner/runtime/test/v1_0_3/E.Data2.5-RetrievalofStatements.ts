/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { beforeAll, describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import type { RuntimeHelper, RuntimeRequestFactory } from "../harness-types.ts";
import { expectAsync, endAsync } from "../super-request.ts";
import type { Statement, StatementResult } from "@conform-ed/contracts/xapi/v1_0_3";
import {
  parseBody,
  requireV103ActivityObject,
  requireV103CategoryActivity,
  requireV103Context,
  requireV103SubStatementObject,
} from "../typing-helpers.ts";

const helper = helperImport as RuntimeHelper;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

function isValidRelativeUrl(value: string | undefined): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  try {
    new URL(value, "http://example.com");
    return true;
  } catch {
    return false;
  }
}

describe("Retrieval of Statements (Data 2.5)", function () {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00108 - below
   * XAPI-00109 - below
   * XAPI-00110 - below
   * XAPI-00111 - below
   * XAPI-00112 - duplicate of XAPI-00149 Communication 2.1.3 Statements GET
   * XAPI-00113 - below
   * XAPI-00114 - below
   */

  /**  XAPI-00113, Data 2.5 Retrieval of Statements
   * An LRS's Statement API, upon processing a successful GET request, will return a single "statements" property and a single "more" property. A single "more" property must be present if there are additional results available.
   */
  describe('An LRS\'s Statement API, upon processing a successful GET request, will return a single "statements" property and a single "more" property. (Data 2.5.s2.table1, XAPI-00113)', function () {
    beforeAll(async function () {
      let template = [{ statement: "{{statements.default}}" }],
        s1 = helper.createFromTemplate(template).statement,
        s2 = helper.createFromTemplate(template).statement,
        stmts = [s1, s2];
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(stmts),
        200,
      );
    });

    it("will return single statements property and may return", async function () {
      let query = "?limit=1";
      let stmtTime = Date.now();
      const res = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .wait(helper.genDelay(stmtTime, query, undefined))
          .headers(helper.addAllHeaders({})),
        200,
      );

      const result = parseBody<StatementResult>(helper, res.body);
      expect(result).toHaveProperty("statements");
      expect(result).toHaveProperty("more");
    });
  });

  /**  XAPI-00110, Data 2.5 Retrieval of Statements
   * A "statements" property is an Array of Statements. Make a GET request which will return at least one statement and confirm the “statements” property is a valid Array of Statements.
   */
  describe('A "statements" property is an Array of Statements (Type, Data 2.5.s2.table1.row1, XAPI-00110)', function () {
    let statement: Statement;
    let substatement: Statement;
    let stmtTime: number;
    beforeAll(async function () {
      let templates = [
        { statement: "{{statements.context}}" },
        { context: "{{contexts.category}}" },
        {
          instructor: {
            objectType: "Agent",
            name: "xAPI mbox",
            mbox: "mailto:pri@adlnet.gov",
          },
        },
      ];
      let data = helper.createFromTemplate(templates);
      statement = data.statement as Statement;

      //randomize data to prevent old results from breaking assertion logic
      const statementContext = requireV103Context(statement, "primary statement");
      const categoryActivity = requireV103CategoryActivity(statementContext, "primary statement");
      categoryActivity.id += helper.generateUUID();
      statement.verb.id += helper.generateUUID();
      statement.actor.mbox = "mailto:" + helper.generateUUID() + "@adlnet.gov";
      statementContext.registration = helper.generateUUID();
      if (!statementContext.instructor || !("mbox" in statementContext.instructor)) {
        throw new Error("primary statement must include context.instructor.mbox");
      }
      statementContext.instructor.mbox = "mailto:" + helper.generateUUID() + "@adlnet.gov";
      const statementActivity = requireV103ActivityObject(statement.object, "primary statement");
      statementActivity.id += helper.generateUUID();

      categoryActivity.id = "http://www.example.com/test/array/statements/pri";

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(statement),
        200,
      );
    });

    beforeAll(async function () {
      let templates = [
        { statement: "{{statements.object_substatement}}" },
        { object: "{{substatements.context}}" },
        { context: "{{contexts.category}}" },
        {
          instructor: {
            objectType: "Agent",
            name: "xAPI mbox",
            mbox: "mailto:sub@adlnet.gov",
          },
        },
      ];
      let data = helper.createFromTemplate(templates);
      substatement = data.statement as Statement;

      //randomize data to prevent old results from breaking assertion logic
      substatement.verb.id += helper.generateUUID();
      substatement.actor.mbox = "mailto:" + helper.generateUUID() + "@adlnet.gov";

      const subObject = requireV103SubStatementObject(substatement.object, "substatement");
      subObject.verb.id += helper.generateUUID();
      if (!("mbox" in subObject.actor)) {
        throw new Error("substatement must include actor.mbox");
      }
      subObject.actor.mbox = "mailto:" + helper.generateUUID() + "@adlnet.gov";
      const nestedActivity = requireV103ActivityObject(subObject.object, "substatement nested object");
      nestedActivity.id += helper.generateUUID();
      if (!subObject.context) {
        throw new Error("substatement must include context");
      }
      const subCategoryActivity = requireV103CategoryActivity(subObject.context, "substatement context");

      subCategoryActivity.id = "http://www.example.com/test/array/statements/sub";
      stmtTime = Date.now();
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(substatement),
        200,
      );
    });

    it('should return StatementResult with statements as array using GET without "statementId" or "voidedStatementId"', async function () {
      const res = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements())
          .wait(helper.genDelay(stmtTime, undefined, undefined))
          .headers(helper.addAllHeaders({})),
        200,
      );

      const result = parseBody<StatementResult>(helper, res.body);
      expect(result).toHaveProperty("statements");
      expect(Array.isArray(result.statements)).toBe(true);
    });
  });

  /**  XAPI-00114, Data 2.5 Retrieval of Statements
   * A "statements" property result which is paginated will create a container for each additional page.
   */
  it('A "statements" property which is too large for a single page will create a container for each additional page (Data 2.5.s2.table1.row1, XAPI-00114)', async function () {
    let statementTemplates = [{ statement: "{{statements.default}}" }];

    let statement1 = helper.createFromTemplate(statementTemplates).statement as Statement;

    let statement2 = helper.createFromTemplate(statementTemplates).statement as Statement;

    let query = helper.getUrlEncoding({ limit: 1 });
    let stmtTime = Date.now();

    await endAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json([statement1, statement2])
        .expect(200),
    );

    const res = await endAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .wait(helper.genDelay(stmtTime, "?" + query, undefined))
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    const results = parseBody<StatementResult>(helper, res.body);
    expect(results.statements).toBeTruthy();
    expect(results.more).toBeTruthy();
  });

  /**  XAPI-00109, Data 2.5 Retrieval of Statements
   * The "more" property is absent or an empty string (no whitespace) if the entire results of the original GET request have been returned. To test make a GET request which will return a known number of statements and check to make sure the LRS either returns an empty string or the more property is absent.
   */
  describe('The "more" property is absent or an empty string (no whitespace) if the entire results of the original GET request have been returned. (Data 2.5.s2.table1.row2, XAPI-00109)', function () {
    it('should return empty "more" property or no "more" property when all statements returned', async function () {
      let query = helper.getUrlEncoding({ verb: "http://adlnet.gov/expapi/non/existent/344588672021038" });
      const res = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .headers(helper.addAllHeaders({})),
        200,
      );

      const result = parseBody<StatementResult>(helper, res.body);
      let passed = false;

      if (result.more === "" || !result.more) passed = true;

      expect(passed).toBe(true);
    });
  });

  /**  XAPI-00108, Data 2.5 Retrieval of Statements
   * If not empty, the "more" property's IRL refers to a specific container object corresponding to the next page of results from the original GET request. To test make a GET request which will return a known number of statements and confirm the LRS returns a “more” property which has an IRL with a container of the remaining statements and that the IRL is valid.
   */
  describe('If not empty, the "more" property\'s IRL refers to a specific container object corresponding to the next page of results from the orignal GET request (Data 2.5.s2.table1.row2, XAPI-00108)', function () {
    it('should return "more" which refers to next page of results', async function () {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?limit=1")
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      const result = parseBody<StatementResult>(helper, res.body);
      expect(result).toHaveProperty("more");
      expect(typeof result.more === "string" ? isValidRelativeUrl(result.more) : false).toBe(true);
      const res2 = await endAsync(
        request("")
          .get(new URL(result.more || "", res.request.href).href)
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      const results2 = parseBody<StatementResult>(helper, res2.body);
      expect(results2.statements).toBeTruthy();
    });
  });

  /**  XAPI-00111, Data 2.5 Retrieval of Statements
   * A "more" property's referenced container object follows the same rules as the original GET request, originating with a single "statements" property and a single "more" property.
   */
  it('A "more" property\'s referenced container object follows the same rules as the original GET request, originating with a single "statements" property and a single "more" property (Data 2.5.s2.table1.row2, XAPI-00111)', async function () {
    let verbTemplate = "http://adlnet.gov/expapi/test/more/target/";
    let id1 = helper.generateUUID();
    let id2 = helper.generateUUID();
    let statementTemplates = [{ statement: "{{statements.default}}" }];

    const statement1 = helper.createFromTemplate(statementTemplates).statement as Statement;
    statement1.verb.id = verbTemplate + "one";
    statement1.id = id1;

    const statement2 = helper.createFromTemplate(statementTemplates).statement as Statement;
    statement2.verb.id = verbTemplate + "two";
    statement2.id = id2;
    let query = helper.getUrlEncoding({ limit: 1 });
    let stmtTime = Date.now();

    await endAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json([statement1, statement2])
        .expect(200),
    );

    const res = await endAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .wait(helper.genDelay(stmtTime, "?" + query, id2))
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    const results = parseBody<StatementResult>(helper, res.body);
    const res2 = await endAsync(
      request("")
        .get(new URL(results.more || "", res.request.href).href)
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    const results2 = parseBody<StatementResult>(helper, res2.body);
    expect(results2.statements).toBeTruthy();
  });
});
