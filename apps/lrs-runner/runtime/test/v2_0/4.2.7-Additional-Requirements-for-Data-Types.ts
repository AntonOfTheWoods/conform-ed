import requestImport from "../super-request.ts";
import type { RequestFactory } from "../super-request.ts";
import { describe, expect, it } from "../bun-test.ts";
import helperImport from "../helper.ts";
import xapiRequestsImport from "./util/requests.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type StatementRecord = Record<string, JsonValue> & {
  id: string;
  object: {
    id: string;
  };
  result?: {
    duration?: string;
  };
  timestamp?: string;
};

type DataTypesHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  buildStatement(): StatementRecord;
  generateUUID(): string;
};

type RequestResult = {
  data: Record<string, JsonValue>;
  status: number;
};

type XapiRequestsSupport = {
  generateRandomMultipartBoundary(): string;
  generateSignedStatementBody(statement: StatementRecord, boundary: string): Promise<string>;
  getActivityWithIRI(iri: string): Promise<RequestResult>;
  getStatementExact(statementId: string): Promise<RequestResult>;
  sendSignedStatementBody(body: string, boundary: string): Promise<RequestResult>;
  sendStatement(statement: StatementRecord): Promise<RequestResult>;
};

let request: RequestFactory = requestImport;
const helper = helperImport as unknown as DataTypesHelper;
const xapiRequests = xapiRequestsImport as XapiRequestsSupport;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("(4.2.7) Additional Requirements for Data Types", () => {
  describe("IRIs", () => {
    it(
      "When storing or comparing IRIs, LRSs shall handle them only by " +
        "using one or more of the approaches described in 5.3.1 (Simple String Comparison) " +
        "and 5.3.2 (Syntax-Based Normalization) of RFC 3987",
      async () => {
        let slug = helper.generateUUID();

        let iriA = `http://example.com/path/${slug}`;
        let iriB = `http://example.com/path/../${slug}`;

        let statement = helper.buildStatement();
        statement.object.id = iriB;

        await xapiRequests.sendStatement(statement);

        // We have to receive an activity regardless here, as the 2.0 spec requires it etc.
        //
        let resA = await xapiRequests.getActivityWithIRI(iriA);
        let resB = await xapiRequests.getActivityWithIRI(iriB);

        let activityA = resA.data;
        let activityB = resB.data;

        let matchesA = activityA["id"] === iriA;
        let matchesB = activityB["id"] === iriB;

        expect(matchesA || matchesB).toBe(true);
      },
    );
  });

  describe("Duration", () => {
    it("On receiving a Duration with more than 0.01 second precision, the LRS shall not reject the request.", async () => {
      let statement = {
        ...helper.buildStatement(),
        id: helper.generateUUID(),
        result: {
          duration: "P1DT12H36M0.12567S",
        },
      };

      let res = await xapiRequests.sendStatement(statement);

      expect(res.status).toEqual(200);
    });

    it("On receiving a Duration with more than 0.01 second precision, the LRS may truncate the duration to 0.01 second precision.", async () => {
      let duration = "P1DT12H36M0.12567S";
      let durationTruncated = "P1DT12H36M0.12S";
      let durationRounded = "P1DT12H36M0.13S";

      let statement = {
        ...helper.buildStatement(),
        id: helper.generateUUID(),
        result: {
          duration,
        },
      };

      await xapiRequests.sendStatement(statement);
      let getRes = await xapiRequests.getStatementExact(statement.id);

      const statementFromLRS = getRes.data as {
        result: {
          duration: string;
        };
      };

      expect(statementFromLRS.result).not.toBeUndefined();
      expect(statementFromLRS.result.duration).not.toBeUndefined();

      let original = duration;
      let received = statementFromLRS.result.duration;

      let matchesOriginal = received === original;
      let matchesTruncation = received === durationTruncated;

      let matchedExpectedValue = matchesOriginal || matchesTruncation;
      let matchesRounded = received === durationRounded;

      if (!matchedExpectedValue) {
        throw new Error(
          matchesRounded
            ? "Only truncation is allowed, rounding the seconds duration to a different hundredths value is not allowed."
            : `The LRS seems to have changed the duration from ${original} -> ${received}.  You may only truncate the seconds down to the hundredths place.`,
        );
      }
    });

    it("When comparing Durations (or Statements containing them), any precision beyond 0.01 second precision shall not be included in the comparison.", async () => {
      let durationFull = "P1DT12H36M0.1237S";
      let durationShort = "P1DT12H36M0.12S";

      let statement = {
        ...helper.buildStatement(),
        id: helper.generateUUID(),
        result: {
          duration: durationShort,
        },
      };

      let boundary = xapiRequests.generateRandomMultipartBoundary();

      let shortDurationSignedBody = await xapiRequests.generateSignedStatementBody(statement, boundary);
      let fullDurationSignedBody = shortDurationSignedBody.replace(durationShort, durationFull);

      let res = await xapiRequests.sendSignedStatementBody(fullDurationSignedBody, boundary);

      if (res.status !== 200) {
        throw new Error(
          "When comparing a statement to its signature, ensure that the result.duration field is only compared to the truncated hundredths place of the seconds value.",
        );
      }
    });
  });

  describe("Timestamps", () => {
    it("checks if the LRS converts timestamps to UTC", async () => {
      const dateEST = "2023-05-04T12:00:00-05:00";
      const dateUTC = "2023-05-04T17:00:00.000Z";

      let id = helper.generateUUID();
      let statement = helper.buildStatement();

      statement.id = id;
      statement.timestamp = dateEST;

      let res = await xapiRequests.sendStatement(statement);
      expect(res.status).toEqual(200);

      let getResponse = await xapiRequests.getStatementExact(id);
      const statementFromLRS = getResponse.data as {
        timestamp: string;
      };

      expect(statementFromLRS).not.toBeUndefined();
      expect(statementFromLRS).not.toBeNull();

      let timeReceived = Date.parse(statementFromLRS.timestamp);
      let timeExpected = Date.parse(dateUTC);

      if (timeExpected !== timeReceived) {
        throw new Error(
          `Statement retrieved with timestamp: ${statementFromLRS.timestamp}, expected equivalence to ${dateUTC}`,
        );
      }
    });
  });
});
