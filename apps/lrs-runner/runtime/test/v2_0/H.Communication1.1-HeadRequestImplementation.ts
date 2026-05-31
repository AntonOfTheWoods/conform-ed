/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase, { expectAsync, type RequestFactory } from "../super-request.ts";
import type { RuntimeRequestResponse } from "../harness-types.ts";

type HeadStatement = {
  object: { id: string };
  actor: unknown;
};

type HeadRequestHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  buildActivityProfile(): Record<string, unknown>;
  buildAgent(): Record<string, unknown>;
  buildAgentProfile(): Record<string, unknown>;
  buildDocument(): string | Record<string, unknown>;
  buildState(): Record<string, unknown>;
  buildStatement(): HeadStatement;
  createFromTemplate(templates: Array<Record<string, unknown>>): { statement: HeadStatement };
  getEndpointActivities(): string;
  getEndpointActivitiesProfile(): string;
  getEndpointActivitiesState(): string;
  getEndpointAgents(): string;
  getEndpointAgentsProfile(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  sendRequest(
    method: string,
    endpoint: string,
    parameters: Record<string, unknown> | undefined,
    body: string | Record<string, unknown> | Array<unknown> | undefined,
    expectedStatus: number,
  ): Promise<RuntimeRequestResponse>;
};

const helper = helperImport as unknown as HeadRequestHelper;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") {
  request = helper.OAuthRequest(request);
}

describe("HEAD Request Implementation Requirements (Communication 1.1)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00125 - below
   * XAPI-00126 - below
   */

  /**  XAPI-00126
   * An LRS accepts HEAD requests.
   */
  describe("An LRS accepts HEAD requests (Communication 1.1, XAPI-00126)", () => {
    /*  This is to be removed in a future version on the specification and is being removed now.
        it('should succeed GET about with no body', () => {
            return helper.sendRequest('head', helper.getEndpointAbout(), undefined, undefined, 200);
        });
        */

    it("should succeed HEAD activities with no body", () => {
      const statement = helper.buildStatement();
      const parameters = {
        activityId: statement.object.id,
      };
      return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
        return helper.sendRequest("head", helper.getEndpointActivities(), parameters, undefined, 200);
      });
    });

    it("should succeed HEAD activities profile with no body", () => {
      const parameters = helper.buildActivityProfile();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointActivitiesProfile(), parameters, document, 204).then(() => {
        return helper.sendRequest("head", helper.getEndpointActivitiesProfile(), parameters, undefined, 200);
      });
    });

    it("should succeed HEAD activities state with no body", () => {
      const parameters = helper.buildState();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
        return helper.sendRequest("head", helper.getEndpointActivitiesState(), parameters, undefined, 200);
      });
    });

    it("should succeed HEAD agents with no body", () => {
      const statement = helper.buildStatement();
      const parameters = {
        agent: statement.actor,
      };
      return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
        return helper.sendRequest("head", helper.getEndpointAgents(), parameters, undefined, 200);
      });
    });

    it("should succeed HEAD agents profile with no body", () => {
      const parameters = helper.buildAgentProfile();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointAgentsProfile(), parameters, document, 204).then(() => {
        return helper.sendRequest("head", helper.getEndpointAgentsProfile(), parameters, undefined, 200);
      });
    });

    it("should succeed HEAD statements with no body", () => {
      return helper.sendRequest("head", helper.getEndpointStatements(), undefined, undefined, 200);
    });
  });

  /**  XAPI-00125
   * An LRS responds to a HEAD request in the same way as a GET request, but without the message-body. This means run ALL GET tests with HEAD
   */
  describe("An LRS responds to a HEAD request in the same way as a GET request, but without the message-body (Communication 1.1.s3.b1, XAPI-00125) **This means run ALL GET tests with HEAD**", () => {
    /*  This is to be removed in a future version on the specification and is being removed now.
        it('should succeed HEAD about with no body', () => {
            return helper.sendRequest('head', helper.getEndpointAbout(), undefined, undefined, 200)
                .then((res) => {
                    expect(Object.keys(res.body)).to.have.length(0);
                });
        });
        */

    it("should succeed HEAD activities with no body", () => {
      const templates = [{ statement: "{{statements.default}}" }];
      const data = helper.createFromTemplate(templates);
      const statement = data.statement;
      const parameters = {
        activityId: data.statement.object.id,
      };
      return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
        return helper
          .sendRequest("head", helper.getEndpointActivities(), parameters, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            expect(Object.keys(res.body as object)).toHaveLength(0);
          });
      });
    });

    it("should succeed HEAD activities profile with no body", () => {
      const parameters = helper.buildActivityProfile();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointActivitiesProfile(), parameters, document, 204).then(() => {
        return helper
          .sendRequest("head", helper.getEndpointActivitiesProfile(), parameters, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            expect(Object.keys(res.body as object)).toHaveLength(0);
          });
      });
    });

    it("should succeed HEAD activities state with no body", () => {
      const parameters = helper.buildState();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
        return helper
          .sendRequest("head", helper.getEndpointActivitiesState(), parameters, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            expect(Object.keys(res.body as object)).toHaveLength(0);
          });
      });
    });

    it("should succeed HEAD agents with no body", () => {
      return helper
        .sendRequest("head", helper.getEndpointAgents(), helper.buildAgent(), undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          expect(Object.keys(res.body as object)).toHaveLength(0);
        });
    });

    it("should succeed HEAD agents profile with no body", () => {
      const parameters = helper.buildAgentProfile();
      const document = helper.buildDocument();
      return helper.sendRequest("post", helper.getEndpointAgentsProfile(), parameters, document, 204).then(() => {
        return helper
          .sendRequest("head", helper.getEndpointAgentsProfile(), parameters, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            expect(Object.keys(res.body as object)).toHaveLength(0);
          });
      });
    });

    it("should succeed HEAD statements with no body", () => {
      const statement = helper.buildStatement();
      return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
        return helper
          .sendRequest("head", helper.getEndpointStatements(), undefined, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            expect(Object.keys(res.body as object)).toHaveLength(0);
          });
      });
    });
  });

  it("An LRS accepts HEAD requests without Content-Length headers (Communication 1.1)", async () => {
    await expectAsync(
      request(helper.getEndpointAndAuth()).head(helper.getEndpointStatements()).headers(helper.addAllHeaders({})),
      200,
    );
  });

  it("An LRS accepts GET requests without Content-Length headers (Communication 1.1)", async () => {
    await expectAsync(
      request(helper.getEndpointAndAuth()).get(helper.getEndpointStatements()).headers(helper.addAllHeaders({})),
      200,
    );
  });
});
