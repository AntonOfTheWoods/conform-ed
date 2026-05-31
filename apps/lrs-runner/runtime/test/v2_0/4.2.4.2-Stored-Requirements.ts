/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { endAsync, type RequestFactory } from "../super-request.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type StoredStatement = {
  stored?: string;
  statements?: StoredStatement[];
  [key: string]: StoredStatement[] | JsonValue | undefined;
};

type StoredRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: StoredStatement };
  genDelay(stmtTime: number, query: string, statementId: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
};

const helper = helperImport as unknown as StoredRequirementsHelper;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

function parseMillisecondsFromIso(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  if (Number.isNaN(Date.parse(value))) {
    return null;
  }

  const fractionMatch = /\.(\d+)/.exec(value);
  if (!fractionMatch || !fractionMatch[1]) {
    return null;
  }

  const milliseconds = Number.parseInt(fractionMatch[1].slice(0, 3).padEnd(3, "0"), 10);
  return Number.isNaN(milliseconds) ? null : milliseconds;
}

describe("Stored Property Requirements (Data 2.4.8)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00097 - below
   *
   * Note XAPI-00023 - below
   */

  /**  XAPI-00097, Data 2.4.8 Stored
   * An LRS MUST assign the "stored" property timestamp upon receiving a statement.
   */
  describe("An LRS MUST accept statements with the stored property (Data 2.4.8.s3.b2, XAPI-00097)", function () {
    const storedTime = new Date("July 15, 2011").toISOString();
    const template = [{ statement: "{{statements.default}}" }, { stored: storedTime }] as Record<string, string>[];
    const data = helper.createFromTemplate(template).statement;
    let postId: string;
    let putId: string;
    let param: string;

    it("using POST", async () => {
      const stmtTime = Date.now();
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders())
          .json(data)
          .expect(200),
      );

      postId = (res.body as string[])[0] as string;
      const query = "?statementId=" + postId;
      const getRes = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .wait(helper.genDelay(stmtTime, query, postId))
          .headers(helper.addAllHeaders())
          .expect(200),
      );

      const result =
        typeof getRes.body === "string"
          ? (JSON.parse(getRes.body) as StoredStatement)
          : (getRes.body as StoredStatement);
      expect(result).toHaveProperty("stored");
      const stmtStored = result["stored"];
      expect(stmtStored).not.toEqual(storedTime);
    });

    it("using PUT", async () => {
      putId = helper.generateUUID();
      param = "?statementId=" + putId;
      const stmtTime = Date.now();

      await endAsync(
        request(helper.getEndpointAndAuth())
          .put(helper.getEndpointStatements() + param)
          .headers(helper.addAllHeaders())
          .json(data)
          .expect(204),
      );

      const getRes = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + param)
          .wait(helper.genDelay(stmtTime, param, putId))
          .headers(helper.addAllHeaders())
          .expect(200),
      );

      const result =
        typeof getRes.body === "string"
          ? (JSON.parse(getRes.body) as StoredStatement)
          : (getRes.body as StoredStatement);
      expect(result).toHaveProperty("stored");
      const stmtStored = result["stored"];
      expect(stmtStored).not.toEqual(storedTime);
    });
  });

  /**  XAPI-00023,  2.4 Statement Properties
   * A "stored" property is a TimeStamp, per section 4.5. An LRS assigns the “stored” property upon receipt with a valid TimeStamp.
   */
  describe("A stored property must be a TimeStamp (Data 2.4.8.s2, XAPI-00023)", () => {
    it("retrieve statements, test a stored property", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements())
          .headers(helper.addAllHeaders())
          .expect(200),
      );

      const result =
        typeof res.body === "string" ? (JSON.parse(res.body) as StoredStatement) : (res.body as StoredStatement);
      const stmts = result["statements"] ?? [];
      const milliChecker = (num: number) => {
        expect(stmts[num]).toHaveProperty("stored");
        const milliseconds = parseMillisecondsFromIso(stmts[num]?.["stored"]);
        expect(milliseconds).not.toEqual(null);

        if ((milliseconds as number) % 10 > 0) {
          expect((milliseconds as number) % 10).toBeGreaterThan(0);

          return;
        }

        const next = num + 1;
        if (next < stmts.length) {
          milliChecker(next);
          return;
        }

        expect((milliseconds as number) % 10).toBeGreaterThan(0);
      };
      milliChecker(0);
    });
  });
});
