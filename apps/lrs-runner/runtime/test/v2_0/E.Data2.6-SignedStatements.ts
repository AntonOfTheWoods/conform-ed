/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import type { StatementV2 } from "@conform-ed/contracts/xapi/v2_0";

import { describe, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
const helper = helperImport as RuntimeHelper;
const request: RuntimeRequestFactory = helper.OAuthRequest(requestBase);

type SignStatementOptions = {
  boundary?: string;
  breakJson?: boolean;
  algorithm?: "RS256" | "RS384" | "RS512" | "HS256";
  attachmentInfo?: {
    contentType?: string;
  };
};

describe("Signed Statements (Data 2.6)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00115 - below
   * XAPI-00116 - below
   * XAPI-00117 - below
   */

  describe("LRS must validate and store statement signatures if they are provided (Data 2.6)", () => {
    const templates = [{ statement: "{{statements.default}}" }];
    const data = (helper.createFromTemplate(templates) as { statement: StatementV2 })["statement"];

    async function expectSignedStatementStatus(options: SignStatementOptions, expectedStatus: number) {
      data.id = helper.generateUUID();
      const body = await helper.signStatement(data, options);

      await new Promise<void>(function (resolve, reject) {
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({ "Content-Type": "multipart/mixed; boundary=" + options.boundary }))
          .body(body)
          .expect(expectedStatus)
          .end(function (error?: unknown) {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
      });
    }

    /**  XAPI-00115, Data 2.5 Signed Statements
     * A Signed Statement MUST include a JSON web signature (JWS) as defined here: http://tools.ietf.org/html/rfc7515, as an Attachment with a usageType of http://adlnet.gov/expapi/attachments/signature and a contentType of application/octet-stream. The LRS must reject with 400 a statement which has usageType of http://adlnet.gov/expapi/attachments/signature and a contentType of application/octet-stream but does not have a signature attached.
     */
    describe("A Signed Statement MUST include a JSON web signature, JWS (Data 2.6.s4.b1, XAPI-00115)", () => {
      it("rejects a signed statement with a malformed signature - bad content type", async () => {
        const options: SignStatementOptions = { attachmentInfo: { contentType: "text/plain; charset=ascii" } };
        await expectSignedStatementStatus(options, 400);
      });

      it("rejects a signed statement with a malformed signature - bad JWS", async () => {
        const options: SignStatementOptions = { breakJson: true };
        await expectSignedStatementStatus(options, 400);
      });
    });

    /**  XAPI-00116, Data 2.6 Signed Statements
     * The JWS signature MUST have a payload of a valid JSON serialization of the complete Statement before the signature was added.The LRS must reject with 400 a statement which does not have a valid JSON serialization.
     */
    describe("The JWS signature MUST have a payload of a valid JSON serialization of the complete Statement before the signature was added. (Data 2.6.s4.b3, XAPI-00116)", () => {
      it("rejects statement with invalid JSON serialization", async () => {
        const options: SignStatementOptions = { breakJson: true };
        await expectSignedStatementStatus(options, 400);
      });
    });

    /**  XAPI-00117, Data 2.6 Signed Statements
     * The JWS signature MUST use an algorithm of "RS256", "RS384", or "RS512". The LRS must reject with 400 a statement which does not use one of these algorithms or does not use one of these algorithms correctly.
     */
    describe('The JWS signature MUST use an algorithm of "RS256", "RS384", or "RS512". (Data 2.6.s4.b4, XAPI-00117)', () => {
      it('Accepts signed statement with "RS256"', async () => {
        // sign statement
        const options: SignStatementOptions = {};
        await expectSignedStatementStatus(options, 200);
      }); //end it good sig with "RS256"

      it('Accepts signed statement with "RS384"', async () => {
        // sign statement
        const options: SignStatementOptions = { algorithm: "RS384" };
        await expectSignedStatementStatus(options, 200);
      }); //end it good sig with "RS384"

      it('Accepts signed statement with "RS512"', async () => {
        // sign statement
        const options: SignStatementOptions = { algorithm: "RS512" };
        await expectSignedStatementStatus(options, 200);
      }); //end it good sig with "RS512"

      it("Rejects signed statement with another algorithm", async () => {
        const options: SignStatementOptions = { algorithm: "HS256" };
        await expectSignedStatementStatus(options, 400);
      });
    });
  }); //end describe statement signatures
});
