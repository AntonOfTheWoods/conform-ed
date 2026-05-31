/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements.
 */

import { describe, expect, it } from "../bun-test.ts";
import oldHelpers from "../helper.ts";
import superRequestBase, { type RequestFactory } from "../super-request.ts";

type AlternateSyntaxHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
};

const helper = oldHelpers as AlternateSyntaxHelper;
let superRequest: RequestFactory = superRequestBase;

if (process.env["OAUTH1_ENABLED"] === "true") {
  superRequest = helper.OAuthRequest(superRequest);
}

describe("Alternate Request Syntax Requirements", () => {
  it("The LRS Spec does not mandate any properties regarding Alternate Request Syntax in xAPI 2.0", async () => {
    expect(true).toEqual(true);
  });
});
