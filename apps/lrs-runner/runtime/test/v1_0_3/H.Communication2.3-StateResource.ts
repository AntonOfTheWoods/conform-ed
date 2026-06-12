/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeRequestFactory, RuntimeRequestResponse } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { expectAsync } from "../super-request.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type StateParams = {
  activityId?: string;
  stateId?: string;
  registration?: string | boolean;
  agent?:
    | string
    | boolean
    | {
        objectType?: string;
        account?: {
          homePage?: string;
          name?: string;
        };
      };
  since?: string | boolean;
};

type StateDocument = {
  [key: string]: JsonValue;
};

type StateHelper = {
  OAuthRequest(request: RuntimeRequestFactory): RuntimeRequestFactory;
  addAllHeaders(headers?: Record<string, string | undefined>): Record<string, string | undefined>;
  buildDocument(): StateDocument;
  buildState(): StateParams;
  generateUUID(): string;
  getEndpointActivitiesState(): string;
  getEndpointAndAuth(): string;
  getTimeMargin(): number;
  getUrlEncoding(object: Record<string, unknown>): string;
  parse(input: string | object): StateDocument | string;
  sendRequest(
    method: string,
    endpoint: string,
    parameters: StateParams,
    body: StateDocument | string | undefined,
    expectedStatus: number,
    headers?: Record<string, string>,
  ): Promise<RuntimeRequestResponse>;
};

const helper = helperImport as unknown as StateHelper;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

/**  Macthup with Conformance Requirements Document
 * XAPI-00187 - below
 * XAPI-00188 - below
 * XAPI-00189 - below
 * XAPI-00190 - below
 * XAPI-00191 - below
 * XAPI-00192 - below
 * XAPI-00193 - below
 * XAPI-00194 - below
 * XAPI-00195 - below
 * XAPI-00196 - below
 * XAPI-00197 - below
 * XAPI-00198 - below
 * XAPI-00199 - below
 * XAPI-00200 - below
 * XAPI-00201 - below
 * XAPI-00202 - below
 * XAPI-00203 - below
 * XAPI-00204 - below
 * XAPI-00205 - No 'since' property with DELETE in the State Resource
 * XAPI-00206 - below
 * XAPI-00207 - below
 * XAPI-00208 - below
 * XAPI-00209 - below
 * XAPI-00210 - below
 * XAPI-00211 - below
 * XAPI-00212 - below
 * XAPI-00213 - below
 * XAPI-00214 - below
 * XAPI-00215 - below
 * XAPI-00216 - below
 * XAPI-00217 - below
 * XAPI-00218 - below
 * XAPI-00219 - below
 * XAPI-00220 - below
 * XAPI-00221 - below
 * XAPI-00222 - duplicate of XAPI-00195
 * XAPI-00223 - No 'since' property with DELETE in the State Resource
 * XAPI-00224 - in Parameters folder
 * XAPI-00225 - in Parameters folder
 * XAPI-00226 - in Parameters folder
 * XAPI-00227 - below
 * XAPI-00228 - in Parameters folder
 * XAPI-00229 - below
 * XAPI-00230 - below
 * XAPI-00231 - below
 * XAPI-00232 - below
 * XAPI-00233 - below
 * XAPI-00234 - below
 * XAPI-00235 - below
 */

describe("State Resource Requirements (Communication 2.3)", () => {
  /**  XAPI-00230, Communication 2.3 State Resource
   * An LRS has a State API with endpoint "base IRI"+"/activities/state"
   */
  it('An LRS has a State Resource with endpoint "base IRI"+"/activities/state" (Communication 2.2.s3.table1.row1, XAPI-00230)', () => {
    //Also covers An LRS will accept a POST request to the State Resource
    let parameters = helper.buildState(),
      document = helper.buildDocument();

    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204);
  });

  /**  XAPI-00190, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful PUT request returns code 204 No Content
   */
  it("An LRS's State Resource accepts PUT requests (Communication 2.3, XAPI-00190)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 204);
  });

  /**  XAPI-00189, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful POST request returns code 204 No Content
   */
  /**  XAPI-00231, Communication 2.3 State Resource
   * An LRS will accept a POST request to the State API
   */
  it("An LRS's State Resource accepts POST requests (Communication 2.3, XAPI-00189, XAPI-00231)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204);
  });

  /**  XAPI-00188, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful GET request returns 200 Ok, State Document
   */
  it("An LRS's State Resource accepts GET requests (Communication 2.3, XAPI-00188)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(body).toEqual(document);
        });
    });
  });

  /**  XAPI-00187, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful DELETE request returns code 204 No Content
   */
  it("An LRS's State Resource accepts DELETE requests (Communication 2.3, XAPI-00187)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 204);
    });
  });

  /**  XAPI-00192, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful GET request with a valid "stateId" as a parameter returns the document satisfying the requirements of the GET and code 200 OK NOTE: There is no requirement here that the LRS reacts to the "since" parameter in the case of a GET request with valid "stateId" - this is intentional
   */
  it('An LRS\'s State Resource upon processing a successful GET request with a valid "stateId" as a parameter returns the document satisfying the requirements of the GET and code 200 OK (Communication 2.3.s3, XAPI-00192)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(body).toEqual(document);
        });
    });
  });

  /**  XAPI-00191, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful DELETE request with a valid "stateId" as a parameter deletes the document satisfying the requirements of the DELETE and returns code 204 No Content NOTE: There is no requirement here that the LRS reacts to the "since" parameter in the case of a DELETE request with valid "stateId" - this is intentional
   */
  it('An LRS\'s State Resource upon processing a successful DELETE request with a valid "stateId" as a parameter deletes the document satisfying the requirements of the DELETE and returns code 204 No Content (Communication 2.3.s3, XAPI-00191)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 204);
    });
  });

  /**  XAPI-00210, Communication 2.3 State Resource
   * An LRS's State API rejects a PUT request without "activityId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a PUT request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row1, XAPI-00210)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["activityId"];
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00209, Communication 2.3 State Resource
   * An LRS's State API rejects a POST request without "activityId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a POST request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row1, XAPI-00209)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["activityId"];
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00208, Communication 2.3 State Resource
   * An LRS's State API rejects a GET request without "activityId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a GET request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row1, XAPI-00208)', () => {
    let parameters = helper.buildState();
    delete (parameters as Record<string, unknown>)["activityId"];
    return helper.sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 400);
  });

  /**  XAPI-00207, Communication 2.3 State Resource
   * An LRS's State API rejects a DELETE request without "activityId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a DELETE request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row1, XAPI-00207)', () => {
    let parameters = helper.buildState();
    delete (parameters as Record<string, unknown>)["activityId"];
    return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 400);
  });

  /**  XAPI-00215, Communication 2.3 State Resource
   * An LRS's State API rejects a PUT request without "agent" as a parameter with error code 400 Bad Request
   */
  //+* This suite validates IRI handling for this version's requirements.**
  it('An LRS\'s State Resource rejects a PUT request without "agent" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row2, XAPI-00215)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["agent"];
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00199, Communication 2.3 State Resource
   * An LRS's State API rejects a PUT request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a PUT request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request (format, Communication 2.3.s3.table1.row2, XAPI-00199)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    parameters.agent = "not JSON";
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00214, Communication 2.3 State Resource
   * An LRS's State API rejects a POST request without "agent" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a POST request without "agent" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row2)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["agent"];
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00198, Communication 2.3 State Resource
   * An LRS's State API rejects a POST request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a POST request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request (format, Communication 2.3.s3.table1.row2, XAPI-00198)', () => {
    it("Should reject POST State with agent invalid value", () => {
      let document = helper.buildDocument();
      let parameters = helper.buildState();
      parameters.agent = true;
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 400);
    });
  });

  /**  XAPI-00213, Communication 2.3 State Resource
   * An LRS's State API rejects a GET request without "agent" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a GET request without "agent" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row2, XAPI-00213)', () => {
    let parameters = helper.buildState();
    delete (parameters as Record<string, unknown>)["agent"];
    return helper.sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 400);
  });

  /**  XAPI-00197, Communication 2.3 State Resource
   * An LRS's State API rejects a GET request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a GET request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request (format, Communication 2.3.s3.table1.row2, XAPI-00197)', () => {
    it('Should reject GET with "agent" with invalid value', () => {
      let parameters = helper.buildState();
      parameters.agent = true;
      return helper.sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00212, Communication 2.3 State Resource
   * An LRS's State API rejects a DELETE request without "agent" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a DELETE request without "agent" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row2, XAPI-00212)', () => {
    let parameters = helper.buildState();
    delete (parameters as Record<string, unknown>)["agent"];
    return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 400);
  });

  /**  XAPI-00196, Communication 2.3 State Resource
   * An LRS's State API rejects a DELETE request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a DELETE request with "agent" as a parameter if it is not in JSON format with error code 400 Bad Request (format, Communication 2.3.s3.table1.row2, XAPI-00196)', () => {
    it('Should reject DELETE with "agent" with invalid value', () => {
      let parameters = helper.buildState();
      parameters.agent = true;
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00218, Communication 2.3 State Resource
   * An LRS's State API can process a PUT request with "registration" as a parameter
   */
  it('An LRS\'s State Resource can process a PUT request with "registration" as a parameter (multiplicity, Communication 2.3.s3.table1.row3, XAPI-00218)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    parameters.registration = helper.generateUUID();
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 204);
  });

  /**  XAPI-00203, Communication 2.3 State Resource
   * An LRS's State API rejects a PUT request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a PUT request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request(format, Communication 2.3.s3.table1.row3, XAPI-00203)', () => {
    it('Should reject PUT with "registration" with invalid value', () => {
      let document = helper.buildDocument();
      let parameters = helper.buildState();
      parameters.registration = true;
      return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 400);
    });
  });

  /**  XAPI-00229, Communication 2.3 State Resource
   * An LRS's State API, rejects a POST request if the document is found and either document is not a valid JSON Object
   */
  describe("An LRSs State Resource, rejects a POST request if the document is found and either document is not a valid JSON Object (multiplicity, Communication 2.3.s3.table1.row3, Communication 2.2.s8.b1, XAPI-00229)", () => {
    // case 1 - bad post
    it("If the document being posted to the State Resource does not have a Content-Type of application/json and the existing document does, the LRS MUST respond with HTTP status code 400 Bad Request, and MUST NOT update the target document as a result of the request.", async () => {
      let parameters = helper.buildState();
      let document = helper.buildDocument();
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({}))
          .json(document),
        204,
      );

      let document2 = "abcdefg";
      let header2 = { "content-type": "not/json" };
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders(header2))
          .body(document2),
        400,
      );

      const res3 = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({})),
        200,
      );

      let result = helper.parse(res3.body as string);
      expect(result).toEqual(document);
    });
    // case 2 - bad existing
    it("If the existing document does not have a Content-Type of application/json but the document being posted to the State Resource does the LRS MUST respond with HTTP status code 400 Bad Request, and MUST NOT update the target document as a result of the request.", async () => {
      let parameters = helper.buildState();
      let attachment = "/ asdf / undefined";
      let header = { "content-type": "application/octet-stream" };
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .put(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders(header))
          .body(attachment),
        204,
      );

      let attachment2 = helper.buildDocument();
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({}))
          .json(attachment2),
        400,
      );

      const res3 = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({})),
        200,
      );

      expect(res3.body).toEqual(attachment);
    });
    // case 3 - bad json
    it("If the document being posted to the State Resource has a content type of Content-Type of application/json but cannot be parsed as a JSON Object, the LRS MUST respond with HTTP status code 400 Bad Request, and MUST NOT update the target document as a result of the request.", async () => {
      let parameters = helper.buildState();
      let document = helper.buildDocument();
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({}))
          .json(document),
        204,
      );

      let header = { "content-type": "application/json" };
      let attachment = JSON.stringify(helper.buildState()) + "{";
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders(header))
          .body(attachment),
        400,
      );

      const res3 = await expectAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters))
          .headers(helper.addAllHeaders({})),
        200,
      );

      let result = helper.parse(res3.body as string);
      expect(result).toEqual(document);
    });
  });

  /**  XAPI-00232, Communication 2.3 State Resource
   * An LRS's State API, rejects a POST request if the document is found and either document's type is not "application/json" with error code 400 Bad Request
   */
  it("An LRS's State Resource, rejects a POST request if the document is found and either document's type is not \"application/json\" with error code 400 Bad Request (Communication 2.2.s8.b1, XAPI-00232)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument(),
      anotherDocument = "abc";
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, anotherDocument, 400);
    });
  });

  /**  XAPI-00233, Communication 2.3 State Resource
   * An LRS's State API, upon receiving a POST request for a document not currently in the LRS, treats it as a PUT request and store a new document. Returning 204 No Content
   */
  it("An LRS's State Resource, upon receiving a POST request for a document not currently in the LRS, treats it as a PUT request and store a new document (Communication 2.2.s7, XAPI-00233)", () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(body).toEqual(document);
        });
    });
  });

  /**  XAPI-00234, Communication 2.3 State Resource
   * An LRS's State API performs a Document Merge if a profileId is found and both it and the document in the POST request have type "application/json". If the merge is successful, the LRS MUST respond with HTTP status code 204 No Content.
   */
  it('An LRS\'s State Resource performs a Document Merge if a document is found and both it and the document in the POST request have type "application/json" (Communication 2.2.s7.b1, Communication 2.2.s7.b2, Communication 2.2.s7.b3, XAPI-00234)', () => {
    let parameters = helper.buildState(),
      document = {
        car: "Honda",
      },
      anotherDocument = {
        type: "Civic",
      };
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("post", helper.getEndpointActivitiesState(), parameters, anotherDocument, 204)
        .then(() => {
          return helper
            .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
            .then((res: RuntimeRequestResponse) => {
              let body = res.body;
              expect(body).toEqual({
                car: "Honda",
                type: "Civic",
              });
            });
        });
    });
  });

  /**  XAPI-00235, Communication 2.3 State Resource
   * An LRS must reject with 400 Bad Request a POST request to the State API which contains name/value pairs with invalid JSON and the Content-Type header is "application/json"
   */
  it("An LRS must reject with 400 Bad Request a POST request to the State Resource which contains name/value pairs with invalid JSON and the Content-Type header is 'application/json' (Communication 2.3, XAPI-00235)", async () => {
    let parameters: { activityId: string; stateId: string; registration?: string } = {
      activityId: "http://www.example.com/activityId/hashset",
      stateId: helper.generateUUID(),
    };
    let agent = encodeURIComponent(
      JSON.stringify({
        objectType: "Agent",
        account: {
          homePage: "http://www.example.com/agentId/1",
          name: "Rick James",
        },
      }),
    ).replace("%3A", "%22");
    parameters.registration = helper.generateUUID();
    let attachment = JSON.stringify(helper.buildDocument());
    let header = { "content-type": "application/json" };
    await expectAsync(
      request(helper.getEndpointAndAuth())
        .post(helper.getEndpointActivitiesState() + "?" + helper.getUrlEncoding(parameters) + "&agent=" + agent)
        .headers(helper.addAllHeaders(header))
        .body(attachment),
      400,
    );
  });

  /**  XAPI-00227, Communication 2.3 State Resource
   * An LRS's State API can process a POST request with "registration" as a parameter
   */
  it('An LRS\'s State Resource can process a POST request with "registration" as a parameter (multiplicity, Communication 2.3.s3.table1.row3, XAPI-00227)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    parameters.registration = helper.generateUUID();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204);
  });

  /**  XAPI-00202, Communication 2.3 State Resource
   * An LRS's State API rejects a POST request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a POST request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request (format, Communication 2.3.s3.table1.row3, XAPI-00202)', () => {
    it('Should reject POST with "registration" with invalid value', () => {
      let document = helper.buildDocument();
      let parameters = helper.buildState();
      parameters.registration = true;
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 400);
    });
  });

  /**  XAPI-00220, Communication 2.3 State Resource
   * An LRS's State API can process a GET request with "registration" as a parameter
   */
  it('An LRS\'s State Resource can process a GET request with "registration" as a parameter (multiplicity, Communication 2.3.s3.table1.row3, XAPI-00220)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    parameters.registration = helper.generateUUID();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(body).toEqual(document);
        });
    });
  });

  /**  XAPI-00201, Communication 2.3 State Resource
   * An LRS's State API rejects a GET request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a GET request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request (format, Communication 2.3.s3.table1.row3, XAPI-00201)', () => {
    it('Should reject GET with "registration" with invalid value', () => {
      let parameters = helper.buildState();
      parameters.registration = true;
      return helper.sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00219, Communication 2.3 State Resource
   * An LRS's State API can process a DELETE request with "registration" as a parameter
   */
  it('An LRS\'s State Resource can process a DELETE request with "registration" as a parameter (multiplicity, Communication 2.3.s3.table1.row3, XAPI-00219)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    parameters.registration = helper.generateUUID();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 204);
    });
  });

  /**  XAPI-00200, Communication 2.3 State Resource
   * An LRS's State API rejects a DELETE request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request
   */
  describe('An LRS\'s State Resource rejects a DELETE request with "registration" as a parameter if it is not a UUID with error code 400 Bad Request (format, Communication 2.3.s3.table1.row3, XAPI-00200)', () => {
    it('Should reject DELETE with "registration" with invalid value', () => {
      let parameters = helper.buildState();
      parameters.registration = true;
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00206, Communication 2.3 State Resource
   * An LRS's State API rejects a PUT request without "stateId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a PUT request without "stateId" as a parameter with error code 400 Bad Request(multiplicity, Communication 2.3.s3.table1.row4, XAPI-00206)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["stateId"];
    return helper.sendRequest("put", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00211, Communication 2.3 State Resource
   * An LRS's State API rejects a POST request without "stateId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a POST request without "stateId" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.3.s3.table1.row4, XAPI-00211)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    delete (parameters as Record<string, unknown>)["stateId"];
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 400);
  });

  /**  XAPI-00217, Communication 2.3 State Resource
   * An LRS's State API can process a GET request with "stateId" as a parameter
   */
  it('An LRS\'s State Resource can process a GET request with "stateId" as a parameter (multiplicity, Communication 2.3.s3.table1.row4, XAPI-00217)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(body).toEqual(document);
        });
    });
  });

  /**  XAPI-00221, Communication 2.3 State Resource
   * An LRS's State API can process a GET request with "since" as a parameter. Returning 200 OK and all matching profiles after the date/time of the “since” parameter.
   */
  it('An LRS\'s State Resource can process a GET request with "since" as a parameter (multiplicity, Communication 2.3.s4.table1.row4, XAPI-00221)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    let stateId = parameters.stateId;

    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      parameters.since = new Date(Date.now() - 60 * 1000 - helper.getTimeMargin()).toISOString(); // Date 1 minute ago
      delete (parameters as Record<string, unknown>)["stateId"];

      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(Array.isArray(body)).toBe(true);
          expect(body).toContain(stateId);
        });
    });
  });

  /**  XAPI-00204, Communication 2.3 State Resource
   * An LRS's State API rejects a GET request with "since" as a parameter if it is not a "TimeStamp", with error code 400 Bad Request
   */
  it('An LRS\'s State Resource rejects a GET request with "since" as a parameter if it is not a "TimeStamp", with error code 400 Bad Request (format, Communication 2.3.s4.table1.row4, XAPI-00204)', () => {
    let parameters = helper.buildState();
    delete (parameters as Record<string, unknown>)["stateId"];
    parameters.since = "not a timestamp";
    return helper.sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 400);
  });

  /**  XAPI-00216, Communication 2.3 State Resource
   * An LRS's State API can process a DELETE request with "stateId" as a parameter
   */
  it('An LRS\'s State Resource can process a DELETE request with "stateId" as a parameter (multiplicity, Communication 2.3.s3.table1.row4, XAPI-00216)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      return helper.sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 204);
    });
  });

  /**  XAPI-00193, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful GET request without "stateId" as a parameter returns an array of ids of state data documents satisfying the requirements of the GET and code 200 OK
   */
  //+* NOTE:  **There is no requirement here that the LRS reacts to the "since" parameter in the case of a GET request with valid "stateId" - this is intentional**
  it('An LRS\'s State Resource upon processing a successful GET request without "stateId" as a parameter returns an array of ids of state data documents satisfying the requirements of the GET and code 200 OK (Communication 2.3.s4, XAPI-00193)', () => {
    let parameters = helper.buildState(),
      document = helper.buildDocument();
    return helper.sendRequest("post", helper.getEndpointActivitiesState(), parameters, document, 204).then(() => {
      delete (parameters as Record<string, unknown>)["stateId"];
      return helper
        .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
        .then((res: RuntimeRequestResponse) => {
          let body = res.body;
          expect(Array.isArray(body)).toBe(true);
        });
    });
  });

  /**  XAPI-00195, Communication 2.3 State Resource
   * An LRS's returned array of ids from a successful GET request all refer to documents stored after the TimeStamp in the "since" parameter of the GET request
   */
  it('An LRS\'s returned array of ids from a successful GET request to the State Resource all refer to documents stored after the TimeStamp in the "since" parameter of the GET request (Communication 2.3.s4.table1.row4, XAPI-00195)', () => {
    let document = helper.buildDocument();
    let state1 = helper.buildState();
    let state2 = helper.buildState();
    let since = new Date(Date.now() - 60 * 1000 - helper.getTimeMargin()).toISOString(); //Date 1  minute ago

    return helper.sendRequest("post", helper.getEndpointActivitiesState(), state1, document, 204).then(() => {
      return helper.sendRequest("post", helper.getEndpointActivitiesState(), state2, document, 204).then(() => {
        let parameters = helper.buildState();
        delete (parameters as Record<string, unknown>)["stateId"];
        parameters.since = since;
        return helper
          .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
          .then((res: RuntimeRequestResponse) => {
            let body = res.body as string[];
            expect(Array.isArray(body)).toBe(true);
            expect(body.length).toBeGreaterThan(1);
            expect(body).toContain(state1.stateId!);
            expect(body).toContain(state2.stateId!);
          });
      });
    });
  });

  /**  XAPI-00194, Communication 2.3 State Resource
   * An LRS's State API upon processing a successful DELETE request without "stateId" as a parameter deletes documents satisfying the requirements of the DELETE and code 204 No Content
   */
  //+* NOTE:  **There is no requirement here that the LRS reacts to the "since" parameter in the case of a GET request with valid "stateId" - this is intentional**
  it('An LRS\'s State Resource upon processing a successful DELETE request without "stateId" as a parameter deletes documents satisfying the requirements of the DELETE and code 204 No Content (Communication 2.3.s5, XAPI-00194)', () => {
    let parameters = helper.buildState();
    parameters.activityId = parameters.activityId + helper.generateUUID();

    return helper
      .sendRequest("post", helper.getEndpointActivitiesState(), parameters, helper.buildDocument(), 204)
      .then(() => {
        delete (parameters as Record<string, unknown>)["stateId"];
        return helper
          .sendRequest("post", helper.getEndpointActivitiesState(), helper.buildState(), helper.buildDocument(), 204)
          .then(() => {
            return helper
              .sendRequest("delete", helper.getEndpointActivitiesState(), parameters, undefined, 204)
              .then(() => {
                return helper
                  .sendRequest("get", helper.getEndpointActivitiesState(), parameters, undefined, 200)
                  .then((res: RuntimeRequestResponse) => {
                    let body = res.body;
                    expect(Array.isArray(body)).toBe(true);
                    expect(body).toHaveLength(0);
                  });
              });
          });
      });
  });
});
