/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import type { StatementV2 } from "@conform-ed/contracts/xapi/v2_0";

import { beforeAll, describe, expect, it } from "../bun-test.ts";
import type { RuntimeTemplatingSelection } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase, { expectAsync, endAsync, type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

type VoidingStatement = StatementV2 & {
  object: {
    id: string;
  };
};

type StatementVoidingHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: VoidingStatement };
  genDelay(stmtTime: number, query?: string, statementId?: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, string>): string;
  parse(input: string | object): StatementV2;
};

const helper = helperImport as unknown as StatementVoidingHelper;
const templatingSelection = templatingSelectionImport as RuntimeTemplatingSelection;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") {
  request = helper.OAuthRequest(request);
}

describe("Statement Lifecycle Requirements (Data 2.3)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00016 - below
   * XAPI-00017 - in voiding.js
   * XAPI-00018 - below
   * XAPI-00019 - in voiding.js
   * XAPI-00020 - in voiding.js
   */

  templatingSelection.createTemplate("voiding.ts");

  /**  XAPI-00018, Data 2.3.2 Voiding
   * An LRS MUST consider a Statement it contains voided if the Statement is not itself a voiding Statement and the LRS also contains a voiding Statement referring to the first Statement.
   * Test: Void a statement and then send a GET for that statement which uses “statementId” instead of “voidedStatementId.” The statement should then not be returned in the GET request, which should return a 404.
   */
  describe("A Voided Statement is defined as a Statement that is not a Voiding Statement and is the Target of a Voiding Statement within the LRS (Data 2.3.2.s2.b3, XAPI-00018)", () => {
    const voidedId = helper.generateUUID();
    let stmtTime: number;

    beforeAll(async () => {
      const templates = [{ statement: "{{statements.default}}" }];
      const voided = helper.createFromTemplate(templates).statement;
      voided.id = voidedId;

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(voided),
        200,
      );
    });

    beforeAll(async () => {
      const templates = [{ statement: "{{statements.voiding}}" }];
      const voiding = helper.createFromTemplate(templates).statement;
      voiding.object.id = voidedId;
      stmtTime = Date.now();

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(voiding),
        200,
      );
    });

    it('Should return a voided statement when using GET "voidedStatementId"', async function () {
      const query = helper.getUrlEncoding({ voidedStatementId: voidedId });
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .wait(helper.genDelay(stmtTime, "?" + query, voidedId))
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      const statement = helper.parse(res.body as string | object);
      expect(statement.id).toEqual(voidedId);
    });

    it('Should return 404 when using GET with "statementId"', async function () {
      const query = helper.getUrlEncoding({ statementId: voidedId });
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?" + query)
          .wait(helper.genDelay(stmtTime, "?" + query, voidedId))
          .headers(helper.addAllHeaders({})),
        404,
      );
    });
  });

  /**  XAPI-00016, Data 2.3.2 Voiding
   * A Voiding Statement cannot Target another Voiding Statement.
   * LRS behavior this new VOIDING statement MAY be rejected.
   * If the LRS accepts that statement, the violating VOIDING statement SHOULD be ignored.
   * Adjust this test accordingly
   */
  describe("A Voiding Statement cannot Target another Voiding Statement (Data 2.3.2.s2.b7, XAPI-00016)", () => {
    let voidedId: string;
    let voidingId: string;

    beforeAll(async () => {
      const templates = [{ statement: "{{statements.default}}" }];
      const data = helper.createFromTemplate(templates).statement;

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data)
          .expect(200),
      );

      voidedId = (res.body as string[])[0] as string;
    });

    beforeAll(async () => {
      const templates = [{ statement: "{{statements.voiding}}" }];
      const data = helper.createFromTemplate(templates).statement;
      data.object.id = voidedId;

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data)
          .expect(200),
      );

      voidingId = (res.body as string[])[0] as string;
    });

    it("Should not void an already voided statement", async function () {
      const templates = [{ statement: "{{statements.object_statementref}}" }, { verb: "{{verbs.voided}}" }] as Record<
        string,
        string
      >[];
      const data = helper.createFromTemplate(templates).statement;
      data.object.id = voidedId;
      const stmtTime = Date.now();

      await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
      );

      const query = "?voidedStatementId=" + voidedId;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements())
          .wait(helper.genDelay(stmtTime, query, voidedId))
          .headers(helper.addAllHeaders({})),
        200,
      );
    });

    it("Should not void a voiding statement", async function () {
      const templates = [{ statement: "{{statements.object_statementref}}" }, { verb: "{{verbs.voided}}" }] as Record<
        string,
        string
      >[];
      const data = helper.createFromTemplate(templates).statement;
      data.object.id = voidingId;
      const stmtTime = Date.now();
      await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
      );

      const query = "?statementId=" + voidingId;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .headers(helper.addAllHeaders({}))
          .wait(helper.genDelay(stmtTime, query, voidingId)),
        200,
      );
    });
  });

  /**  4.2.4.1 LRS Rejection Cases
   * Update for 2.0
   *
   * Never reject a stateemnt for using the voided verb.
   */
  describe("An LRS SHALL NOT reject a voided statement because it cannot find the ID of the Object of that statement, nor does the LRS have to try to find it. (4.2.4.1 LRS Rejection Cases, XAPI-00016)", () => {
    const nonExistentStatementID = helper.generateUUID();

    it("Shall not reject a voided statement.", async function () {
      const templates = [{ statement: "{{statements.object_statementref}}" }, { verb: "{{verbs.voided}}" }] as Record<
        string,
        string
      >[];
      const data = helper.createFromTemplate(templates).statement;
      data.object.id = nonExistentStatementID;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
        200,
      );
    });
  });
});
