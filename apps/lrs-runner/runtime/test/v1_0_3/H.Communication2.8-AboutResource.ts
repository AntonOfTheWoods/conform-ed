/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { endAsync } from "../super-request.ts";
import type { RuntimeRequestFactory, RuntimeRequestResponse } from "../harness-types.ts";

type AboutPayload = {
  version: string[];
};

type AboutHelper = {
  OAuthRequest(request: RuntimeRequestFactory): RuntimeRequestFactory;
  addBasicAuthenicationHeader(headers: Record<string, string>): Record<string, string>;
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
    parameters: object | undefined,
    body: object | string | undefined,
    expectedStatus: number,
  ): Promise<RuntimeRequestResponse>;
};

const helper = helperImport as unknown as AboutHelper;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("About Resource Requirements (Communication 2.8)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00315 - below
   * XAPI-00316 - below
   * XAPI-00317 - below
   * XAPI-00318 - below
   * XAPI-00319 - below
   * XAPI-00320 - bad test - extesion property is optional in spec
   * XAPI-00321 - below
   */

  /**  XAPI-00315, Communication 2.8 About Resource
   * An LRS has an About API with endpoint "base IRI"+"/about"
   */
  it('An LRS has an About Resource with endpoint "base IRI"+"/about" (Communication 2.8, XAPI-00315)', () => {
    return helper.sendRequest("get", "/about", undefined, undefined, 200);
  });

  /**  XAPI-00319, Communication 2.8 About Resource
   * An LRS's About Resource accepts GET requests. Upon processing a successful GET request returns a version property and code 200 OK
   */
  it("An LRS's About Resource upon processing a successful GET request returns a version property and code 200 OK (multiplicity, Communication 2.8.s4, XAPI-00319)", () => {
    return helper.sendRequest("get", "/about", undefined, undefined, 200).then((res: RuntimeRequestResponse) => {
      let about = res.body as AboutPayload;
      expect(about).toHaveProperty("version");
    });
  });

  /**  XAPI-00318, Communication 2.8 About Resource
   * An LRS's About API's version property is an array of strings
   */
  it("An LRS's About Resource's version property is an array of strings (format, Communication 2.8.s4.table1.row1, XAPI-00318)", () => {
    return helper.sendRequest("get", "/about", undefined, undefined, 200).then((res: RuntimeRequestResponse) => {
      let about = res.body as AboutPayload;
      expect(about).toHaveProperty("version");
      expect(Array.isArray(about.version)).toBe(true);
    });
  });

  /**  XAPI-00317, Communication 2.8 About Resource
   * An LRS's About API's version property contains at least one string of "1.0.x"
   */
  it("An LRS's About Resource's version property contains at least one string of \"1.0.3\" (Communication 2.8.s5.b1.b1, XAPI-00317)", () => {
    return helper.sendRequest("get", "/about", undefined, undefined, 200).then((res: RuntimeRequestResponse) => {
      let about = res.body as AboutPayload;
      expect(about).toHaveProperty("version");
      expect(Array.isArray(about.version)).toBe(true);

      let foundVersion = false;
      about.version.forEach((item: string) => {
        if (item === "1.0.3") {
          foundVersion = true;
        }
      });
      expect(foundVersion).toBe(true);
    });
  });

  /**  XAPI-00316, Communication 2.8 About Resource
   * An LRS's About API's version property can only have values of "0.9", "0.95", "1.0.0", or “1.0.x” with
   */
  it('An LRS\'s About Resource\'s version property can only have values of "0.9", "0.95", "1.0.0", or ""1.0." + X" with (Communication 2.8.s5.b1.b1, XAPI-00316)', () => {
    return helper.sendRequest("get", "/about", undefined, undefined, 200).then((res: RuntimeRequestResponse) => {
      let about = res.body as AboutPayload;
      expect(about).toHaveProperty("version");
      expect(Array.isArray(about.version)).toBe(true);
      // let validVersions = ['0.9', '0.95', '1.0.0', '1.0.1', '1.0.3'];
      // about.version.forEach(function (item) {
      //     expect(validVersions).toContain(item);
      // });

      expect(about.version).toContain("1.0.3");
    });
  });

  /**  XAPI-00321, Communication 2.8 About Resource
   * An LRS rejects with error code 400 Bad Request, a Request which does not use a "X-Experience-API-Version" header name to any API except the About API
   */
  describe('An LRS rejects with error code 400 Bad Request, a Request which does not use a "X-Experience-API-Version" header name to any Resource except the About Resource (multiplicity, Communication 2.8.s4.table1.row2, XAPI-00321)', () => {
    it("using Statement Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });

    it("using Activities Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivities())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });

    it("using Activities Profile Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivitiesProfile())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });

    it("using Activities State Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointActivitiesState())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });

    it("using Agents Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointAgents())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });

    it("using Agents Profile Endpoint", async () => {
      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointAgentsProfile())
          .headers(helper.addBasicAuthenicationHeader({})),
      );

      if (res.statusCode === 400) {
        // if the status code is a 400, we expect that the request was handled and rejected by a 1.0.x compliant lrs and test for that version in the result headers or that the the request was forwarded to a 0.9x lrs and rejected
        expect(res.statusCode).toEqual(400);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^2\.0\.\d+$|^1\.0\.\d+$|^0?\.9\d*?$/);
      } else if (res.statusCode === 200) {
        // if the status code is a 200, we expect that the request was rerouted to a 0.9x compliant lrs and test for that version in the result headers
        expect(res.statusCode).toEqual(200);
        expect(res.headers["x-experience-api-version"]).toBeTruthy();
        expect(res.headers["x-experience-api-version"]).toMatch(/^0?\.9\d*?$/);
      } else {
        // at this point there was some error and we pass along the message
        let str = "Received: status code - " + res.statusCode + " from LRS of version ";
        if (res.headers["x-experience-api-version"]) {
          str += res.headers["x-experience-api-version"];
        } else {
          str += "missing";
        }
        str += ".\nExpected: either 400 with LRS version 1.0.x, 2.0.x, or 200 with LRS version 0.9x.";
        throw new Error(str);
      }
    });
  });
});
