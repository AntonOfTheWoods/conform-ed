/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { expectAsync } from "../super-request.ts";

const helper = helperImport as RuntimeHelper;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Alternate Request Syntax Requirements (Communication 1.3)", () => {
  /**  XAPI-00336, Communication 1.3 Alternate Request Syntax
   * The LRS MUST support the Alternate Request Syntax.
   */
  describe("The LRS MUST support the Alternate Request Syntax (Communication 1.3.s3.b15, XAPI-00336)", () => {
    /**  XAPI-00148, Communication 2.1.2 POST Statements
     * An LRS accepts a valid POST request containing a GET request returning 200 OK and the StatementResult Object.
     */
    it("An LRS accepts a valid POST request containing a GET request returning 200 OK and the StatementResult Object. (Communication 1.3, Communication 2.1.2.s2.b3, XAPI-00148)", async () => {
      const res = await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements() + "?method=GET")
          .headers(helper.addAllHeaders({}))
          .form({ limit: 1 }),
        200,
      );

      let results = helper.parse(res.body as string, () => undefined);
      expect(results).toHaveProperty("statements");
      expect(results).toHaveProperty("more");
    });

    it("An LRS rejects an alternate request syntax not issued as a POST", () => {
      let parameters = { method: "POST" };
      let formBody = helper.buildFormBody(helper.buildStatement());
      return helper.sendRequest("put", helper.getEndpointStatements(), parameters, formBody, 400);
    });

    it("An LRS accepts an alternate request syntax PUT issued as a POST", () => {
      let parameters = { method: "PUT" };
      let formBody = {
        statementId: helper.generateUUID(),
        content: helper.buildStatement(),
      };
      return helper.sendRequest(
        "post",
        helper.getEndpointStatements(),
        parameters,
        helper.getUrlEncoding(formBody),
        204,
      );
    });

    it("During an alternate request syntax the LRS treats the listed form parameters, 'Authorization', 'X-Experience-API-Version', 'Content-Type', 'Content-Length', 'If-Match' and 'If-None-Match', as header parameters (Communictation 1.3.s3.b7)", () => {
      let parameters = { method: "PUT" };
      let sID = helper.generateUUID();
      let formBody = {
        statementId: sID,
        "X-Experience-API-Version": "0.8",
        content: helper.buildStatement(),
      };
      return helper.sendRequest(
        "post",
        helper.getEndpointStatements(),
        parameters,
        helper.getUrlEncoding(formBody),
        400,
      );
    });

    it("An LRS will reject an alternate request syntax which contains any extra information with error code 400 Bad Request (Communication 1.3.s3.b4)", () => {
      let templates = [{ statement: "{{statements.default}}" }];
      let data = helper.createFromTemplate(templates);
      let statement = data["statement"];
      let sID = helper.generateUUID();
      let parameters = {
        method: "PUT",
        statementId: sID,
      };
      let body = {
        statementId: sID,
        content: statement,
      };

      return helper.sendRequest("post", helper.getEndpointStatements(), parameters, helper.getUrlEncoding(body), 400);
    });

    describe('An LRS will reject an alternate request syntax sending content which does not have a form parameter with the name of "content" (Communication 1.3.s3.b4)', () => {
      it("will pass PUT with content body which is url encoded", async () => {
        let headers = helper.addAllHeaders({});
        let auth = headers["Authorization"];
        let query = helper.getUrlEncoding({ method: "PUT" });

        let templates = [{ statement: "{{statements.default}}" }];
        let data = helper.createFromTemplate(templates)["statement"];

        let form = {
          statementId: helper.generateUUID(),
          content: JSON.stringify(data),
          "X-Experience-API-Version": "1.0.3",
          Authorization: auth,
        };

        await expectAsync(
          request(helper.getEndpointAndAuth())
            .post(helper.getEndpointStatements() + "?" + query)
            .headers({ "content-type": "application/x-www-form-urlencoded" })
            .form(form),
          204,
        );
      });

      it("will fail PUT with no content body", () => {
        let parameters = { method: "PUT" };
        return helper.sendRequest("post", helper.getEndpointStatements(), parameters, undefined, 400);
      });

      it("will fail PUT with content body which is not url encoded", async () => {
        let headers = helper.addAllHeaders({});
        let query = helper.getUrlEncoding({ method: "PUT" });
        let templates = [{ statement: "{{statements.default}}" }];
        let data = helper.createFromTemplate(templates)["statement"];
        headers["content-type"] = "application/x-www-form-urlencoded";

        let form = {
          statementId: helper.generateUUID(),
          content: JSON.stringify(data),
          "X-Experience-API-Version": "1.0.3",
        };

        await expectAsync(
          request(helper.getEndpointAndAuth())
            .post(helper.getEndpointStatements() + "?" + query)
            .headers(headers)
            .body(JSON.stringify(form)),
          400,
        );
      });
    });
  });
});
