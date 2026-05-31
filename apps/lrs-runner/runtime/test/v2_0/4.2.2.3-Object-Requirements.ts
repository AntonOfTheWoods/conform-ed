/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import helperImport from "../helper.ts";
import requestBase, { expectAsync, type RequestFactory } from "../super-request.ts";
import templatingSelectionImport from "../templatingSelection.ts";

import { describe, it } from "../bun-test.ts";

type ObjectStatement = {
  actor?: {
    account?: {
      homePage?: string;
      name?: string;
    };
    openid?: string;
  };
  attachments?: Array<{
    usageType?: string;
  }>;
  id?: string;
  object: {
    definition: {
      interactionType?: string;
      moreInfo?: string;
      type?: string;
    };
    objectType?: string;
  };
  verb?: {
    id?: string;
  };
};

type ObjectRequirementsHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(headers: Record<string, string | undefined>): Record<string, string | undefined>;
  createFromTemplate(templates: Array<Record<string, unknown>>): {
    statement: ObjectStatement;
  };
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
};

type TemplateSelectionSupport = {
  createTemplate(templateName: string): void;
};

const helper = helperImport as unknown as ObjectRequirementsHelper;
const templatingSelection = templatingSelectionImport as TemplateSelectionSupport;
let request: RequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Object Property Requirements (Data 2.4.4)", () => {
  //Data 2.4.4 object
  /**  Matchup with Conformance Requirements Document
   * XAPI-00046 - in objects.js
   */
  templatingSelection.createTemplate("objects.ts");

  //Data 2.4.4.1 when objectType is activity
  /**  Matchup with Conformance Requirements Document
   * XAPI-00047 - in activities.js
   * XAPI-00048 - in activities.js
   * XAPI-00049 - in activities.js
   * XAPI-00050 - in activities.js
   * XAPI-00051 - in activities.js
   * XAPI-00052 - in activities.js
   * XAPI-00053 - in activities.js
   * XAPI-00054 - in activities.js
   * XAPI-00055 - in activities.js
   * XAPI-00056 - in activities.js
   * XAPI-00057 - in activities.js
   * XAPI-00058 - in activities.js
   * XAPI-00059 - in activities.js
   * XAPI-00060 - in activities.js
   * XAPI-00061 - in activities.js
   * XAPI-00062 - in activities.js
   * XAPI-00063 - in activities.js
   * XAPI-00064 - below
   */
  templatingSelection.createTemplate("activities.ts");

  /**  XAPI-00064, Data 2.4.4.1 when objectType is activity
   * An Activity Definition uses the "interactionType" property if correctResponsesPattern is present. An LRS rejects a statement with 400 Bad Request if a correctResponsePattern is present and interactionType is not.
   */
  describe('An Activity Definition uses the "interactionType" property if any of the correctResponsesPattern, choices, scale, source, target, or steps properties are used (Multiplicity, Data 2.4.4.1.s8, XAPI-00064) **Implicit**', () => {
    it('Activity Definition uses correctResponsesPattern without "interactionType" property', async () => {
      const correctResponsesPatterntemplates = [
        { statement: "{{statements.default}}" },
        { object: "{{activities.other}}" },
      ];
      const correctResponsesPattern = helper.createFromTemplate(correctResponsesPatterntemplates).statement;
      delete correctResponsesPattern.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(correctResponsesPattern),
        400,
      );
    });

    it('Activity Definition uses choices without "interactionType" property', async () => {
      const choicetemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.choice}}" }];
      const choice = helper.createFromTemplate(choicetemplates).statement;
      delete choice.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(choice),
        400,
      );
    });

    it('Activity Definition uses fill-in without "interactionType" property', async () => {
      const fillintemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.fill_in}}" }];
      const fillin = helper.createFromTemplate(fillintemplates).statement;
      delete fillin.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(fillin),
        400,
      );
    });

    it('Activity Definition uses scale without "interactionType" property', async () => {
      const scaletemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.likert}}" }];
      const scale = helper.createFromTemplate(scaletemplates).statement;
      delete scale.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(scale),
        400,
      );
    });

    it('Activity Definition uses long-fill-in without "interactionType" property', async () => {
      const fillintemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.long_fill_in}}" }];
      const fillin = helper.createFromTemplate(fillintemplates).statement;
      delete fillin.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(fillin),
        400,
      );
    });

    it('Activity Definition uses source without "interactionType" property', async () => {
      const sourcetemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.matching}}" }];
      const source = helper.createFromTemplate(sourcetemplates).statement;
      delete source.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(source),
        400,
      );
    });

    it('Activity Definition uses target without "interactionType" property', async () => {
      const targettemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.matching_target}}" }];
      const target = helper.createFromTemplate(targettemplates).statement;
      delete target.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(target),
        400,
      );
    });

    it('Activity Definition uses numeric without "interactionType" property', async () => {
      const numerictemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.numeric}}" }];
      const numeric = helper.createFromTemplate(numerictemplates).statement;
      delete numeric.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(numeric),
        400,
      );
    });

    it('Activity Definition uses other without "interactionType" property', async () => {
      const othertemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.other}}" }];
      const other = helper.createFromTemplate(othertemplates).statement;
      delete other.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(other),
        400,
      );
    });

    it('Activity Definition uses performance without "interactionType" property', async () => {
      const stepstemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.performance}}" }];
      const steps = helper.createFromTemplate(stepstemplates).statement;
      delete steps.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(steps),
        400,
      );
    });

    it('Activity Definition uses sequencing without "interactionType" property', async () => {
      const seqtemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.sequencing}}" }];
      const seq = helper.createFromTemplate(seqtemplates).statement;
      delete seq.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(seq),
        400,
      );
    });

    it('Activity Definition uses true-false without "interactionType" property', async () => {
      const tftemplates = [{ statement: "{{statements.default}}" }, { object: "{{activities.true_false}}" }];
      const tf = helper.createFromTemplate(tftemplates).statement;
      delete tf.object.definition.interactionType;
      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(tf),
        400,
      );
    });
  });

  //Data 2.4.4.2 - when the object is an agent or a group
  /**  Matchup with Conformance Requirements Document
   * XAPI-00065 - below
   */

  /** XAPI-00065, Data 2.4.4.2 when the object is an agent or a group
   * Statements that use an Agent or Group as an Object MUST specify an "objectType" property. The LRS rejects with 400 Bad Request if the “objectType” property is absent and the Object is an Agent Object or Group Object.
   */
  describe('Statements that use an Agent or Group as an Object MUST specify an "objectType" property. (Data 2.4.4.2.s1.b1, XAPI-00065)', () => {
    it("should fail when using agent as object and no objectType", async () => {
      const templates = [{ statement: "{{statements.object_agent_default}}" }];
      const data = helper.createFromTemplate(templates).statement;
      delete data.object.objectType;

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });

    it("should fail when using group as object and no objectType", async () => {
      const templates = [{ statement: "{{statements.object_group_default}}" }];
      const data = helper.createFromTemplate(templates).statement;
      delete data.object.objectType;

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });

    it("substatement should fail when using agent as object and no objectType", async () => {
      const templates = [
        { statement: "{{statements.object_substatement}}" },
        { object: "{{statements.object_agent_default}}" },
      ];
      const data = helper.createFromTemplate(templates).statement;
      delete data.object.objectType;

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });

    it("substatement should fail when using group as object and no objectType", async () => {
      const templates = [
        { statement: "{{statements.object_substatement}}" },
        { object: "{{statements.object_group_default}}" },
      ];
      const data = helper.createFromTemplate(templates).statement;
      delete data.object.objectType;

      await expectAsync(
        request(helper.getEndpointAndAuth())
          .post(helper.getEndpointStatements())
          .headers(helper.addAllHeaders({}))
          .json(data),
        400,
      );
    });
  });

  //Data 2.4.4.3 - when the object is a statement
  /** Matchup with Conformance Requirements Document
   * XAPI-00066 - in substatements.js
   * XAPI-00067 - in substatements.js
   * XAPI-00068 - in substatements.js
   * XAPI-00069 - in substatements.js
   * XAPI-00070 - in substatements.js
   * XAPI-00071 - in substatements.js
   * XAPI-00072 - in statementrefs.js
   * XAPI-00073 - in statementrefs.js
   */
  templatingSelection.createTemplate("substatements.ts");
  templatingSelection.createTemplate("statementrefs.ts");
});
