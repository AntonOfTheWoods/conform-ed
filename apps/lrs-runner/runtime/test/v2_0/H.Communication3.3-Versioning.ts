/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { beforeAll, describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { type RequestFactory } from "../super-request.ts";
import { expectAsync, endAsync } from "../super-request.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type QueryValue = string | number | boolean | undefined;

type StatementShape = {
  actor: JsonValue;
  id: string;
  object: JsonValue;
  verb: {
    id?: string;
  };
};

type StatementResponse = {
  actor?: JsonValue;
  object?: JsonValue;
  verb?: JsonValue;
};

type VersioningHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  addBasicAuthenicationHeader(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: StatementShape };
  genDelay(stmtTime: number, query: string, statementId: string): Promise<void>;
  generateUUID(): string;
  getEndpointAbout(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, QueryValue>): string;
  isEqual(left: JsonValue, right: JsonValue): boolean;
};

const helper = helperImport as unknown as VersioningHelper;
let request: RequestFactory = requestBase;

const REG_ALLOWED_VERSIONS = /^2\.0\.0$|^1\.0(\.[1-3])$/;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Versioning Requirements (Communication 3.3)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00330 - below
   * XAPI-00331 - below
   * XAPI-00332 - in Data 2.4.10 Statements Version Property
   * XAPI-00333 - below
   */

  /**  XAPI-00333, Communication 3.3 Versioning
   * An LRS sends a header response with "X-Experience-API-Version" as the name and latest patch version after 1.0.0 as the value
   */
  it('An LRS sends a header response with "X-Experience-API-Version" as the name and the latest patch version after "1.0.0" as the value (Format, Communication 3.3.s3.b1, Communication 3.3.s3.b2, XAPI-00333)', async function () {
    const id = helper.generateUUID();
    const statementTemplates = [{ statement: "{{statements.default}}" }];

    const statementContainer = helper.createFromTemplate(statementTemplates);
    const statement = statementContainer.statement;
    statement.id = id;
    const query = helper.getUrlEncoding({ statementId: id });
    const stmtTime = Date.now();

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

    expect(res.headers).toHaveProperty("x-experience-api-version");
    expect(res.headers["x-experience-api-version"]).toMatch(REG_ALLOWED_VERSIONS);
  });

  /**  XAPI-00330, Communication 3.3 Versioning
   * An LRS will not modify Statements based on a "version" before "1.0.1"
   */
  describe('An LRS will not modify Statements based on a "version" before "1.0.1" (Communication 3.3.s3.b4, XAPI-00330)', function () {
    it("should not convert newer version format to prior version format", async function () {
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
          .get(helper.getEndpointStatements() + "?statementId=" + data.id)
          .wait(helper.genDelay(stmtTime, query, data.id))
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      const responseBody =
        typeof res.body === "string" ? (JSON.parse(res.body) as StatementResponse) : (res.body as StatementResponse);
      expect(helper.isEqual(data.actor ?? null, responseBody["actor"] ?? null)).toBe(true);
      expect(helper.isEqual(data.object ?? null, responseBody["object"] ?? null)).toBe(true);
      expect(helper.isEqual(data.verb ?? null, responseBody["verb"] ?? null)).toBe(true);
    });
  });

  /**  XAPI-00331, Communication 3.3 Versioning
   * An LRS rejects with error code 400 Bad Request, a Request which the "X-Experience-API-Version" header's value
   * is anything but "2.0" or "2.0.x", where x is the semantic versioning number to any API except the About API.
   */
  describe('An LRS rejects with error code 400 Bad Request, a Request which does not use a "X-Experience-API-Version" header name to any Resource except the About Resource (Format, Communication 3.3.s4.b1, Communication 3.3.s3.b7, Communication 2.8.s5.b4, XAPI-00331)', function () {
    it('Should pass when About GET without header "X-Experience-API-Version"', async function () {
      await expectAsync(request(helper.getEndpointAndAuth()).get(helper.getEndpointAbout()), 200);
    });

    it('Should fail when Statement GET without header "X-Experience-API-Version"', async function () {
      const stmtId = helper.generateUUID();
      beforeAll(async function () {
        const templates = [{ statement: "{{statements.default}}" }];
        const statementContainer = helper.createFromTemplate(templates);
        const data = statementContainer.statement;

        await expectAsync(
          request(helper.getEndpointAndAuth())
            .put(helper.getEndpointStatements() + "?statementId=" + stmtId)
            .headers(helper.addAllHeaders({}))
            .json(data),
          200,
        );
      });

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + "?statementId=" + stmtId)
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        expect(res.headers["x-experience-api-version"]).toMatch(REG_ALLOWED_VERSIONS);
      } else if (res.statusCode === 404) {
        expect(res.headers["x-experience-api-version"]).toMatch(/^0\.95?$/);
      } else {
        throw new Error(
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 2.0.0 with status code 400 or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });

    it('Should fail when Statement POST without header "X-Experience-API-Version"', async function () {
      const templates = [{ statement: "{{statements.default}}" }];
      const statementContainer = helper.createFromTemplate(templates);
      const data = statementContainer.statement;

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addBasicAuthenicationHeader({}))
          .json(data),
      );

      if (res.statusCode === 400) {
        expect(res.headers["x-experience-api-version"]).toMatch(REG_ALLOWED_VERSIONS);
      } else if (res.statusCode === 404) {
        expect(res.headers["x-experience-api-version"]).toMatch(/^0\.95?$/);
      } else {
        throw new Error(
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 2.0.0 with status code 400 or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });

    it('Should fail when Statement PUT without header "X-Experience-API-Version"', async function () {
      const templates = [{ statement: "{{statements.default}}" }];
      const statementContainer = helper.createFromTemplate(templates);
      const data = statementContainer.statement;

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .put(helper.getEndpointStatements() + "?statementId=" + helper.generateUUID())
          .headers(helper.addBasicAuthenicationHeader({}))
          .json(data),
      );

      if (res.statusCode === 400) {
        expect(res.headers["x-experience-api-version"]).toMatch(REG_ALLOWED_VERSIONS);
      } else if (res.statusCode === 404) {
        expect(res.headers["x-experience-api-version"]).toMatch(/^0\.95?$/);
      } else {
        throw new Error(
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 2.0.0 or 1.0.X with status code 400, or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });
  });
});
