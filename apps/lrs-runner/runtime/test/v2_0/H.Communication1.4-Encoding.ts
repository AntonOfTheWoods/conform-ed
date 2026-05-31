/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { endAsync, type RequestFactory } from "../super-request.ts";

type QueryValue = string | number | boolean | undefined;

type UnicodeStatement = {
  verb: {
    display: Record<string, string>;
    id: string;
  };
};

type EncodingHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: UnicodeStatement };
  genDelay(stmtTime: number, query: string, statementId: string | null): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, QueryValue>): string;
};

const helper = helperImport as unknown as EncodingHelper;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Encoding Requirements (Communication 1.4)", () => {
  /**  XAPI-00015,  2.2. Formatting Requirements
   * All Strings are encoded and interpreted as UTF-8
   * This req should stay here (Communication 1.4).  This is the only place which mentions UTF-8 in the spec, other than Comm 1.3
   */
  it("All Strings are encoded and interpreted as UTF-8 (Communication 1.4.s1.b1, XAPI-00015)", async function () {
    const verbTemplate = "http://adlnet.gov/expapi/test/unicode/target/";
    const verb = verbTemplate + helper.generateUUID();
    const unicodeTemplates = [{ statement: "{{statements.unicode}}" }];

    const statementContainer = helper.createFromTemplate(unicodeTemplates);
    const unicode = statementContainer.statement;
    unicode.verb.id = verb;

    const query = helper.getUrlEncoding({
      verb: verb,
    });
    const stmtTime = Date.now();

    await endAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json(unicode)
        .expect(200),
    );

    const res = await endAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .wait(helper.genDelay(stmtTime, "?" + query, null))
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    const results =
      typeof res.body === "string"
        ? (JSON.parse(res.body) as { statements: Array<{ verb: { display: Record<string, string> } }> })
        : (res.body as { statements: Array<{ verb: { display: Record<string, string> } }> });
    const languages = results.statements[0]?.verb.display ?? {};
    let unicodeConformant = true;
    for (const key in languages) {
      if (languages[key] !== unicode.verb.display[key]) unicodeConformant = false;
    }
    expect(unicodeConformant).toBe(true);
  });
});
