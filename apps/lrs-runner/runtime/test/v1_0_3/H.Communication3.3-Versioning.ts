/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";

import { beforeAll, describe, expect, it } from "../bun-test.ts";
import type { RuntimeRequestFactory } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { expectAsync, endAsync } from "../super-request.ts";
import { createStatement } from "../typing-helpers.ts";

type TemplateValue = string | number | boolean | { [key: string]: TemplateValue } | TemplateValue[];

type VersioningHelper = {
  OAuthRequest(request: RuntimeRequestFactory): RuntimeRequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  addBasicAuthenicationHeader(headers: Record<string, string>): Record<string, string>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: Statement };
  genDelay(stmtTime: number, query?: string, statementId?: string): Promise<void>;
  generateUUID(): string;
  getEndpointAbout(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, TemplateValue>): string;
  isEqual(
    left: Statement["actor"] | Statement["object"] | Statement["verb"],
    right: Statement["actor"] | Statement["object"] | Statement["verb"],
  ): boolean;
  parse(input: string | object, done?: (error?: unknown) => void): Statement;
};

const helper = helperImport as unknown as VersioningHelper;
let request: RuntimeRequestFactory = requestBase;

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
    let id = helper.generateUUID();
    let statementTemplates = [{ statement: "{{statements.default}}" }];

    let statement = createStatement(helper, statementTemplates);
    statement.id = id;
    let query = helper.getUrlEncoding({ statementId: id });
    let stmtTime = Date.now();

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
      let templates = [{ statement: "{{statements.default}}" }];
      let data = createStatement(helper, templates);
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
          .get(helper.getEndpointStatements() + "?statementId=" + data.id)
          .wait(helper.genDelay(stmtTime, query, data.id))
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      let statement = helper.parse(res.body as string, () => undefined) as Record<string, unknown>;
      expect(helper.isEqual(data.actor, statement["actor"] as Record<string, unknown> as Statement["actor"])).toBe(
        true,
      );
      expect(helper.isEqual(data.object, statement["object"] as Record<string, unknown> as Statement["object"])).toBe(
        true,
      );
      expect(helper.isEqual(data.verb, statement["verb"] as Record<string, unknown> as Statement["verb"])).toBe(true);
    });
  });

  /**  XAPI-00331, Communication 3.3 Versioning
   * An LRS rejects with error code 400 Bad Request, a Request which the "X-Experience-API-Version" header's value is anything but "1.0" or "1.0.x", where x is the semantic versioning number to any API except the About API
   */
  describe('An LRS rejects with error code 400 Bad Request, a Request which does not use a "X-Experience-API-Version" header name to any Resource except the About Resource (Format, Communication 3.3.s4.b1, Communication 3.3.s3.b7, Communication 2.8.s5.b4, XAPI-00331)', function () {
    it('should pass when About GET without header "X-Experience-API-Version"', async function () {
      await expectAsync(request(helper.getEndpointAndAuth()).get(helper.getEndpointAbout()), 200);
    });

    it('should fail when Statement GET without header "X-Experience-API-Version"', async function () {
      let stmtId = helper.generateUUID();
      beforeAll(async function () {
        let templates = [{ statement: "{{statements.default}}" }];
        let data = helper.createFromTemplate(templates).statement;

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
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 1.0.3 with status code 400 or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });

    it('should fail when Statement POST without header "X-Experience-API-Version"', async function () {
      let templates = [{ statement: "{{statements.default}}" }];
      let data = createStatement(helper, templates);

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
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 1.0.3 with status code 400 or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });

    it('should fail when Statement PUT without header "X-Experience-API-Version"', async function () {
      let templates = [{ statement: "{{statements.default}}" }];
      let data = createStatement(helper, templates);

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
          `Version header (${res.headers["x-experience-api-version"]}) and Status Code (${res.statusCode}) do not match specification.  Expected version header 1.0.3 with status code 400 or version header 0.9 or 0.95 with status code either 400 or 404.`,
        );
      }
    });
  });
});
