/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import requestModule from "../super-request.ts";
import { describe, expect, it } from "../bun-test.ts";
import helperModule from "../helper.ts";
import xapiRequestsModule from "./util/requests.ts";
import type { StatementV2 } from "@conform-ed/contracts/xapi/v2_0";
import type { RuntimeRequestFactory, RuntimeRequestResponse } from "../harness-types.ts";

type ActivityStatement = StatementV2 & {
  object: {
    id: string;
    definition: {
      name: Record<string, string>;
    };
  };
};

type ActivityParams = {
  activityId?: string | boolean;
};

type ActivitiesHelper = {
  OAuthRequest(request: RuntimeRequestFactory): RuntimeRequestFactory;
  buildActivity(): ActivityParams;
  createFromTemplate(templates: Array<{ statement?: string; object?: string }>): { statement: ActivityStatement };
  generateUUID(): string;
  getEndpointActivities(): string;
  getEndpointStatements(): string;
  sendRequest(
    method: string,
    endpoint: string,
    parameters: ActivityParams | undefined,
    body: ActivityStatement[] | undefined,
    expectedStatus: number,
  ): Promise<RuntimeRequestResponse>;
};

type ActivitiesRequests = {
  getActivityWithIRI(iri: string): Promise<{ status: number; data: { id?: string; objectType?: string } }>;
};

let request: RuntimeRequestFactory = requestModule;
const helper = helperModule as unknown as ActivitiesHelper;
const xapiRequests = xapiRequestsModule as ActivitiesRequests;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

describe("Activities Resource Requirements (Communication 2.5)", () => {
  /**
   * XAPI-00250 - below
   * XAPI-00251 - below
   * XAPI-00252 - below
   * XAPI-00253 - below
   * XAPI-00254 - below
   */

  /**  XAPI-00252, Communication 2.5 Activities Resource
   * An LRS has an Activities API with endpoint "base IRI" + /activities" (7.5) Implicit (in that it is not named this by the spec).
   */
  it('An LRS has an Activities Resource with endpoint "base IRI" + /activities" (Communication 2.5, Implicit) **Implicit** (in that it is not named this by the spec)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = data.statement;
    let parameters = {
      activityId: data.statement.object.id,
    };
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200);
    });
  });

  /**  XAPI-00253, Communication 2.5 Activities Resource
   * An LRS's Activities API accepts GET requests.
   */
  it("An LRS's Activities Resource accepts GET requests (Communication 2.5, XAPI-00253)", () => {
    let templates = [{ statement: "{{statements.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = data.statement;
    let parameters = {
      activityId: data.statement.object.id,
    };
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200);
    });
  });

  /**  XAPI-00251, Communication 2.5 Activities Resource
   * An LRS's Activities API upon processing a successful GET request returns 200 OK and the complete Activity Object.
   */
  it("An LRS's Activities Resource upon processing a successful GET request returns the complete Activity Object (Communication 2.5.s1)", () => {
    let templates = [{ statement: "{{statements.object_activity}}" }, { object: "{{activities.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = data.statement;
    statement.object.id = "http://www.example.com/verify/complete/34534";

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      let parameters = {
        activityId: statement.object.id,
      };
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200).then((res) => {
        let activity = res.body;
        expect(activity).toBeTruthy();
        expect(activity).toEqual(statement.object);
      });
    });
  });

  /**  XAPI-00250, Communication 2.5 Activities Resource
   * An LRS's Activities API rejects a GET request without "activityId" as a parameter with error code 400 Bad Request.
   */
  it('An LRS\'s Activities Resource rejects a GET request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication.md#2.5.s1.table1.row1, XAPI-00250)', () => {
    return helper.sendRequest("get", helper.getEndpointActivities(), undefined, undefined, 400);
  });

  // Note: Tests focusing on type "String" as a parameter are likely to be stricken or reworded before final release.
  // Also note: Using an it over an it nullifies the inner its, consider using a describe.
  it('An LRS\'s Activities Resource rejects a GET request with "activityId" as a parameter if it is not type "String" with error code 400 Bad Request (format, Communication 2.5.s1.table1.row1)', () => {
    it('Should reject GET with "activityId" with invalid value', () => {
      let parameters = helper.buildActivity();
      parameters.activityId = true;
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00254, Communication 2.5 Activities Resource
   * The Activity Object must contain all available information about an activity from any statements who target the same “activityId”.
   * For example, LRS accepts two statements each with a different language description of an activity using the exact same “activityId”.
   * The LRS must return both language descriptions when a GET request is made to the Activities endpoint for that “activityId”.
   */
  it('The Activity Object must contain all available information about an activity from any statements who target the same "activityId". For example, LRS accepts two statements each with a different language description of an activity using the exact same "activityId". The LRS must return both language descriptions when a GET request is made to the Activities endpoint for that "activityId" (multiplicity, Communication.md#2.5.s1.table1.row1, XAPI-00254)', () => {
    let templates = [{ statement: "{{statements.object_activity}}" }, { object: "{{activities.default}}" }];
    let data = helper.createFromTemplate(templates);
    let data2 = helper.createFromTemplate(templates);
    let statement = data.statement;
    let statement2 = data2.statement;
    statement.object.id = "http://www.example.com/verify/complete/34534100123";
    statement2.object.id = "http://www.example.com/verify/complete/34534100123";

    statement2.object.definition.name["fr-FR"] = "réunion";
    delete statement2.object.definition.name["en-US"];

    return helper
      .sendRequest("post", helper.getEndpointStatements(), undefined, [statement, statement2], 200)
      .then(() => {
        let parameters = {
          activityId: statement.object.id,
        };
        return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200).then((res) => {
          let activity = res.body as ActivityStatement["object"];
          expect(activity.definition.name["en-US"]).toEqual("example meeting");
          expect(activity.definition.name["fr-FR"]).toEqual("réunion");
        });
      });
  });

  it("If an LRS does not have a canonical definition of the Activity to return, the LRS shall still return an Activity Object when queried.", async () => {
    let randomIRI = "http://www.example.com/never-before-seen-activityId/" + helper.generateUUID();
    let res = await xapiRequests.getActivityWithIRI(randomIRI);

    expect(res.status).toEqual(200);
    expect(res.data.id).toEqual(randomIRI);
    expect(res.data.objectType).toEqual("Activity");
  });
});
