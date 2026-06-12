/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import type { TemplateBundleLike } from "../typing-helpers.ts";

const helper = helperImport as RuntimeHelper;
let request: RuntimeRequestFactory = requestBase;

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
   * An LRS has an Activities API with endpoint "base IRI" + /activities" (7.5) Implicit (in that it is not named this by the spec)
   */
  it('An LRS has an Activities Resource with endpoint "base IRI" + /activities" (Communication 2.5, Implicit) **Implicit** (in that it is not named this by the spec)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = (data as TemplateBundleLike).statement as { object: { id: string } };
    let parameters = {
      activityId: statement.object.id,
    };
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200);
    });
  });

  /**  XAPI-00253, Communication 2.5 Activities Resource
   * An LRS's Activities API accepts GET requests
   */
  it("An LRS's Activities Resource accepts GET requests (Communication 2.5, XAPI-00253)", () => {
    let templates = [{ statement: "{{statements.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = (data as TemplateBundleLike).statement as { object: { id: string } };
    let parameters = {
      activityId: statement.object.id,
    };
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200);
    });
  });

  /**  XAPI-00251, Communication 2.5 Activities Resource
   * An LRS's Activities API upon processing a successful GET request returns 200 OK and the complete Activity Object
   */
  it("An LRS's Activities Resource upon processing a successful GET request returns the complete Activity Object (Communication 2.5.s1)", () => {
    let templates = [{ statement: "{{statements.object_activity}}" }, { object: "{{activities.default}}" }];
    let data = helper.createFromTemplate(templates);
    let statement = (data as TemplateBundleLike).statement as { object: { id: string } };
    statement.object.id = "http://www.example.com/verify/complete/34534";

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      let parameters = {
        activityId: statement.object.id,
      };
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 200).then((res) => {
        let activity = res.body as Record<string, unknown>;
        expect(activity).toBeTruthy();
        expect(activity).toEqual(statement.object);
      });
    });
  });

  /**  XAPI-00250, Communication 2.5 Activities Resource
   * An LRS's Activities API rejects a GET request without "activityId" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s Activities Resource rejects a GET request without "activityId" as a parameter with error code 400 Bad Request (multiplicity, Communication.md#2.5.s1.table1.row1, XAPI-00250)', () => {
    return helper.sendRequest("get", helper.getEndpointActivities(), undefined, undefined, 400);
  });

  //Note: tests focusing on type "String" as a parameter are likely to be stricken or reworded before final release.
  //Also note: using an it over and it nullifies the inner its, consider using a describe.
  it('An LRS\'s Activities Resource rejects a GET request with "activityId" as a parameter if it is not type "String" with error code 400 Bad Request (format, Communication 2.5.s1.table1.row1)', () => {
    it('Should reject GET with "activityId" with invalid value', () => {
      let parameters = helper.buildActivity();
      (parameters as Record<string, unknown>)["activityId"] = true;
      return helper.sendRequest("get", helper.getEndpointActivities(), parameters, undefined, 400);
    });
  });

  /**  XAPI-00254, Communication 2.5 Activities Resource
   * The Activity Object must contain all available information about an activity from any statements who target the same “activityId”. For example, LRS accepts two statements each with a different language description of an activity using the exact same “activityId”. The LRS must return both language descriptions when a GET request is made to the Activities endpoint for that “activityId”.
   */
  it('The Activity Object must contain all available information about an activity from any statements who target the same "activityId". For example, LRS accepts two statements each with a different language description of an activity using the exact same "activityId". The LRS must return both language descriptions when a GET request is made to the Activities endpoint for that "activityId" (multiplicity, Communication.md#2.5.s1.table1.row1, XAPI-00254)', () => {
    let templates = [{ statement: "{{statements.object_activity}}" }, { object: "{{activities.default}}" }];
    type ActivityStatementObj = { object: { id: string; definition: { name: Record<string, string> } } };
    let data = helper.createFromTemplate(templates);
    let data2 = helper.createFromTemplate(templates);
    let statement = (data as TemplateBundleLike).statement as ActivityStatementObj;
    let statement2 = (data2 as TemplateBundleLike).statement as ActivityStatementObj;
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
          let activity = res.body as { definition: { name: Record<string, string> } };
          expect(activity.definition.name["en-US"]).toEqual("example meeting");
          expect(activity.definition.name["fr-FR"]).toEqual("réunion");
        });
      });
  });
});
