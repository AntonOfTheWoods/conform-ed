/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { endAsync, type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

type QueryValue = string | number | boolean | undefined;

type VersionStatement = {
  id: string;
  version: string;
};

type VersionResponse = {
  version?: string;
};

type VersionRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, string>>): { statement: VersionStatement };
  genDelay(stmtTime: number, query: string, statementId: string): Promise<void>;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getUrlEncoding(object: Record<string, QueryValue>): string;
};

type TemplateSelectionSupport = {
  createTemplate(templateName: string): void;
};

const helper = helperImport as unknown as VersionRequirementsHelper;
const templatingSelection = templatingSelectionImport as TemplateSelectionSupport;
let request: RequestFactory = requestBase;

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
    const stmtTime = Date.now();

    const statementTemplates = [{ statement: "{{statements.default}}" }];

    const version = "2.0.0";
    const id = helper.generateUUID();

    const statementContainer = helper.createFromTemplate(statementTemplates);
    const statement = statementContainer.statement;
    statement.id = id;
    statement.version = version;

    const query = helper.getUrlEncoding({ statementId: id });

    await endAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointStatements())
        .headers(helper.addAllHeaders({}))
        .json(statement)
        .expect(200),
    );

    const getRes = await endAsync(
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .wait(helper.genDelay(stmtTime, "?" + query, id))
        .headers(helper.addAllHeaders({}))
        .expect(200),
    );

    const results =
      typeof getRes.body === "string" ? (JSON.parse(getRes.body) as VersionResponse) : (getRes.body as VersionResponse);
    expect(results["version"]).toEqual(version);
  });
});
