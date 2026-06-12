/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { beforeAll, describe, expect, it } from "../bun-test.ts";
import type { Statement } from "@conform-ed/contracts/xapi/v1_0_3";

import helperImport from "../helper.ts";
import type { RuntimeHelper, RuntimeRequestFactory, RuntimeTemplatingSelection } from "../harness-types.ts";
import requestBase from "../super-request.ts";
import { expectAsync, endAsync } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";
import { parseBody, requireV103ActivityObject } from "../typing-helpers.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type StatementTemplateBundle = {
  statement: Statement;
};

type ScoreLike = {
  max: number;
  min: number;
  raw: number;
  scaled: number;
};

type AttachmentLike = {
  fileUrl?: string;
  usageType: string;
};

const helper = helperImport as RuntimeHelper;
const templatingSelection = templatingSelectionImport as unknown as RuntimeTemplatingSelection;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

function createStatementFromTemplate(templates: Array<Record<string, unknown>>): Statement {
  return (helper.createFromTemplate(templates) as StatementTemplateBundle).statement;
}

function requireScore(statement: Statement, source: string): ScoreLike {
  const score = statement.result?.score;
  if (
    !score ||
    typeof score.min !== "number" ||
    typeof score.raw !== "number" ||
    typeof score.max !== "number" ||
    typeof score.scaled !== "number"
  ) {
    throw new Error(`${source} must include result.score with numeric min/raw/max/scaled values`);
  }

  return score as ScoreLike;
}

type ActorRecordLike = {
  objectType?: JsonValue;
  openid?: JsonValue;
  account?: JsonValue;
  [key: string]: JsonValue;
};

function getActorRecord(statement: Statement, source: string): ActorRecordLike {
  const actor = statement.actor as Record<string, JsonValue>;
  if (!actor || typeof actor !== "object") {
    throw new Error(`${source} must include an object actor`);
  }

  return actor;
}

function requireFirstAttachment(statement: Statement, source: string): AttachmentLike {
  const attachment = statement.attachments?.[0];
  if (!attachment || typeof attachment.usageType !== "string") {
    throw new Error(`${source} must include attachments[0].usageType`);
  }

  return attachment as AttachmentLike;
}

function getOrCreateDefinitionExtensions(statement: Statement, source: string): Record<string, JsonValue> {
  const activity = requireV103ActivityObject(statement.object, source);
  if (!activity.definition) {
    throw new Error(`${source} must include object.definition`);
  }

  if (!activity.definition.extensions) {
    activity.definition.extensions = {};
  }

  return activity.definition.extensions as Record<string, JsonValue>;
}

function getOrCreateContextExtensions(statement: Statement, source: string): Record<string, JsonValue> {
  if (!statement.context) {
    throw new Error(`${source} must include context`);
  }

  if (!statement.context.extensions) {
    statement.context.extensions = {};
  }

  return statement.context.extensions as Record<string, JsonValue>;
}

function getOrCreateResultExtensions(statement: Statement, source: string): Record<string, JsonValue> {
  if (!statement.result) {
    throw new Error(`${source} must include result`);
  }

  if (!statement.result.extensions) {
    statement.result.extensions = {};
  }

  return statement.result.extensions as Record<string, JsonValue>;
}

beforeAll(async function () {
  console.log("Setting up\nAccounting for time differential between test suite and lrs");
  await new Promise<void>((resolve, reject) => {
    helper.setTimeMargin((err?: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

describe("Formatting Requirements (Data 2.2)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00001 - in formatting.js
   * XAPI-00002 - below
   * XAPI-00003 - in formatting.js
   * XAPI-00004 - in formatting.js
   * XAPI-00005 - in formatting.js
   * XAPI-00006 - in formatting.js
   * XAPI-00007 - in formatting.js
   * XAPI-00008 - in formatting.js
   * XAPI-00009 - in formatting.js
   * XAPI-00010 - in formatting.js
   * XAPI-00011 - below
   * XAPI-00012 - below
   * XAPI-00013 - in formatting.js
   * XAPI-00014 - below and in verify.js
   * XAPI-00015 - in Communication 1.4 - should stay in Comm 1.4 Encoding
   */

  templatingSelection.createTemplate("formatting.ts");

  /**  XAPI-00002, Data 2.2 Formatting Requirements
   * An LRS stores 32-bit floating point numbers with at least the precision of IEEE 754
   */
  describe("An LRS stores 32-bit floating point numbers with at least the precision of IEEE 754 (Data 2.2.s4.b3, XAPI-00002)", function () {
    it("should pass and keep precision", async function () {
      const templates = [{ statement: "{{statements.result}}" }, { result: "{{results.default}}" }];
      const data = createStatementFromTemplate(templates);
      const id = helper.generateUUID();
      const query = `?statementId=${id}`;
      const min = 0.12123434;
      const raw = 12.125;
      const max = 45.45;
      const stmtTime = Date.now();

      data.id = id;
      const initialScore = requireScore(data, "precision statement template");
      initialScore.min = min;
      initialScore.raw = raw;
      initialScore.max = max;
      initialScore.scaled = min;

      await endAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data)
          .expect(200),
      );

      const res = await endAsync(
        request(helper.getEndpointAndAuth())
          .get(helper.getEndpointStatements() + query)
          .wait(helper.genDelay(stmtTime, query, id))
          .headers(helper.addAllHeaders({}))
          .expect(200),
      );

      const storedStatement = parseBody<Statement>(helper, res.body);
      const score = requireScore(storedStatement, "stored precision statement");
      expect(score.min).toEqual(min);
      expect(score.raw).toEqual(raw);
      expect(score.max).toEqual(max);
      expect(score.scaled).toEqual(min);
    });
  });

  /**  XAPI-00012
   * The LRS rejects with error code 400 Bad Request parameter values which do not validate to the same standards required for values of the same types in Statements.
   */
  describe("The LRS rejects with error code 400 Bad Request parameter values which do not validate to the same standards required for values of the same types in Statements (Data 2.2.s4.b4, XAPI-00012)", function () {
    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ statementId: "wrong" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });

    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ voidedStatementId: "wrong" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });

    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ agent: "wrong" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });

    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ verb: "not.a.valid.iri.com/verb" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });

    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ activity: "not.a.valid.iri.com/activity" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });

    it("should reject when statementId value is invalid", async function () {
      const query = helper.getUrlEncoding({ registration: "wrong" });
      request(helper.getEndpointAndAuth())
        .get(helper.getEndpointStatements() + "?" + query)
        .headers(helper.addAllHeaders({}))
        .expect(400);
    });
  });

  /**  XAPI-00014, Data 2.2 Formatting Requirements
   * All Objects are well-created JSON Objects (Nature of Binding)
   */
  describe("All Objects are well-created JSON Objects (Nature of binding, Data 2.1, XAPI-00014) **Implicit**", function () {
    templatingSelection.createTemplate("verify.ts");

    it("An LRS rejects a not well-created JSON Object", async function () {
      const malformedTemplates = [{ statement: "{{statements.default}}" }];
      const malformed = createStatementFromTemplate(malformedTemplates);
      getActorRecord(malformed, "malformed statement").objectType = '"objectType": "Agent"';

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(malformed),
        400,
      );
    });
  });

  /**  XAPI-00011, Data 2.2 Formatting Requirements
   * An LRS rejects with error code 400 Bad Request a Statement containing IRL or IRI values without a scheme.
   */
  describe("An LRS rejects with error code 400 Bad Request a Statement containing IRL or IRI values without a scheme. (Data 2.2.s4.b1.b8, XAPI-00011)", function () {
    it("should fail with bad verb id scheme", async function () {
      const data = createStatementFromTemplate([{ statement: "{{statements.default}}" }]);
      data.id = helper.generateUUID();
      data.verb.id = data.verb.id.replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad verb openid scheme", async function () {
      const data = createStatementFromTemplate([{ statement: "{{statements.actor}}" }]);
      data.id = helper.generateUUID();
      getActorRecord(data, "bad openid statement").openid = "open.id.com/testUser";
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad account homePage", async function () {
      const data = createStatementFromTemplate([{ statement: "{{statements.actor}}" }]);
      data.id = helper.generateUUID();
      getActorRecord(data, "bad account statement").account = {
        homePage: "homePage.com/testUser",
        name: "123456",
      };
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad object id", async function () {
      const data = createStatementFromTemplate([{ statement: "{{statements.default}}" }]);
      data.id = helper.generateUUID();
      const activity = requireV103ActivityObject(data.object, "bad object id statement");
      activity.id = activity.id.replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad object type", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.default}}" },
        { object: "{{activities.default}}" },
      ]);
      data.id = helper.generateUUID();
      const activity = requireV103ActivityObject(data.object, "bad object type statement");
      if (typeof activity.definition?.type !== "string") {
        throw new Error("bad object type statement must include object.definition.type");
      }
      (activity.definition as Record<string, unknown>)["type"] = (
        (activity.definition as Record<string, unknown>)["type"] as string
      ).replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad object moreInfo", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.default}}" },
        { object: "{{activities.default}}" },
      ]);
      data.id = helper.generateUUID();
      const activity = requireV103ActivityObject(data.object, "bad object moreInfo statement");
      if (typeof activity.definition?.moreInfo !== "string") {
        throw new Error("bad object moreInfo statement must include object.definition.moreInfo");
      }
      activity.definition.moreInfo = activity.definition.moreInfo.replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with attachment bad usageType", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.attachment}}" },
        {
          attachments: [
            {
              usageType: "http://example.com/attachment-usage/test",
              display: { "en-US": "A test attachment" },
              description: { "en-US": "A test attachment (description)" },
              contentType: "text/plain; charset=ascii",
              length: 27,
              sha2: "495395e777cd98da653df9615d09c0fd6bb2f8d4788394cd53c56a3bfdcd848a",
              fileUrl: "http://over.there.com/file.txt",
            },
          ],
        },
      ]);
      data.id = helper.generateUUID();
      const attachment = requireFirstAttachment(data, "bad attachment usageType statement");
      attachment.usageType = attachment.usageType.replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad attachment fileUrl", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.attachment}}" },
        {
          attachments: [
            {
              usageType: "http://example.com/attachment-usage/test",
              display: { "en-US": "A test attachment" },
              description: { "en-US": "A test attachment (description)" },
              contentType: "text/plain; charset=ascii",
              length: 27,
              sha2: "495395e777cd98da653df9615d09c0fd6bb2f8d4788394cd53c56a3bfdcd848a",
              fileUrl: "http://over.there.com/file.txt",
            },
          ],
        },
      ]);
      data.id = helper.generateUUID();
      const attachment = requireFirstAttachment(data, "bad attachment fileUrl statement");
      if (typeof attachment.fileUrl !== "string") {
        throw new Error("bad attachment fileUrl statement must include attachments[0].fileUrl");
      }
      attachment.fileUrl = attachment.fileUrl.replace("http://", "");
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad object definition extension", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.default}}" },
        { object: "{{activities.default}}" },
      ]);
      data.id = helper.generateUUID();
      const extensions = getOrCreateDefinitionExtensions(data, "bad object definition extension statement");
      extensions["not.valid.com/extension"] = 1234;
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad context extension", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.default}}" },
        { context: "{{contexts.default}}" },
      ]);
      data.id = helper.generateUUID();
      const extensions = getOrCreateContextExtensions(data, "bad context extension statement");
      extensions["example.com/extension/wrong"] = 1234;
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });

    it("should fail with bad result extension", async function () {
      const data = createStatementFromTemplate([
        { statement: "{{statements.default}}" },
        { result: "{{results.default}}" },
      ]);
      data.id = helper.generateUUID();
      const extensions = getOrCreateResultExtensions(data, "bad result extension statement");
      extensions["example.com/extension/wrong"] = 1234;
      const headers = helper.addAllHeaders({});

      request(helper.getEndpointAndAuth())
        .put(helper.getEndpointStatements() + "?statementId=" + data.id)
        .headers(headers)
        .json(data)
        .expect(400);
    });
  });
});
