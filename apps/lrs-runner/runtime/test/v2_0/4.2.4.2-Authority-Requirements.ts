/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { expectAsync, endAsync, type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type AuthorityStatement = {
  id: string;
};

type StatementResponse = {
  authority?: JsonValue;
};

type AuthorityRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, unknown>>): { statement: AuthorityStatement };
  genDelay(stmtTime: number, query: string, statementId: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
};

type TemplateSelectionSupport = {
  createTemplate(templateName: string): void;
};

const helper = helperImport as unknown as AuthorityRequirementsHelper;
const templatingSelection = templatingSelectionImport as TemplateSelectionSupport;
let request: RequestFactory = requestBase;

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
  it('An LRS rejects with error code 400 Bad Request, a Request whose "authority" is a Group and consists of non-O-Auth Agents (Data 2.4.9.s3.b3, XAPI-00100)', async () => {
    const templates = [
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
    const statementContainer = helper.createFromTemplate(templates as unknown as Array<Record<string, unknown>>);
    const data = statementContainer.statement;
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
      const templates = [{ statement: "{{statements.default}}" }];
      const statementContainer = helper.createFromTemplate(templates);
      const data = statementContainer.statement;
      data.id = helper.generateUUID();
      const query = "?statementId=" + data.id;
      const stmtTime = Date.now();

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

      const statement =
        typeof res.body === "string" ? (JSON.parse(res.body) as StatementResponse) : (res.body as StatementResponse);
      expect(statement).toHaveProperty("authority");
    });
  });
});
