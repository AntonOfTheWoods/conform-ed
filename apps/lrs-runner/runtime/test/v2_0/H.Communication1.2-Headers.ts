/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { type RequestFactory } from "../super-request.ts";

type HeadersHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
};

const helper = helperImport as HeadersHelper;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Headers Requirements (Communication 1.2)", () => {});
