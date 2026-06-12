/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

import { describe, expect, it } from "../bun-test.ts";
import type { RuntimeHelper, RuntimeRequestFactory } from "../harness-types.ts";
import helperImport from "../helper.ts";
import requestBase from "../super-request.ts";
import { createStatement } from "../typing-helpers.ts";

const helper = helperImport as RuntimeHelper;
let request: RuntimeRequestFactory = requestBase;

if (process.env["OAUTH1_ENABLED"] === "true") request = helper.OAuthRequest(request);

type PersonObject = {
  objectType?: string;
  name?: string[];
  mbox?: string[];
  mbox_sha1sum?: string[];
  openid?: string[];
  account?: { homePage: string; name: string }[];
};

function isValidEmailAddress(value: unknown): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

describe("Agents Resource Requirements (Communication 2.4)", () => {
  /**  Matchup with Conformance Requirements Document
   * XAPI-00236 - below
   * XAPI-00237 - below
   * XAPI-00238 - below
   * XAPI-00239 - below
   * XAPI-00240 - below
   * XAPI-00241 - below
   * XAPI-00242 - below
   * XAPI-00243 - below
   * XAPI-00244 - below
   * XAPI-00245 - below
   * XAPI-00246 - same as 248 - The Agents Resource MUST have an endpoint which accepts GET requests and returns a special, Person Object where each attribute has an array value and it is legal to include multiple identifying properties.
   * XAPI-00247 - same as 248 - If an LRS does not have any additional information about an Agent to return from the Agents Resource, the LRS MUST still return a Person when queried, but that Person Object will only include the information associated with the requested Agent.
   * XAPI-00248 - below
   * XAPI-00249 - below
   */

  /**  XAPI-00245, Communication 2.4 Agents Resource
   * An LRS has an Agents API with endpoint "base IRI" + /agents"
   */
  it('An LRS has an Agents Resource with endpoint "base IRI" + /agents" (Communication 2.4, XAPI-00245) **Implicit** (in that it is not named this by the spec)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);
    let parameters = {
      agent: statement.actor,
    };
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper.sendRequest("get", helper.getEndpointAgents(), parameters, undefined, 200);
    });
  });

  /**  XAPI-00236, Communication 2.4 Agents Resource
   * An LRS's Agents API accepts GET requests with response 200 OK, Person Object
   */
  it("An LRS's Agents Resource accepts GET requests (Communication 2.4.s2, XAPI-00236)", () => {
    return helper.sendRequest("get", helper.getEndpointAgents(), helper.buildAgent(), undefined, 200);
  });

  /**  XAPI-00248, Communication 2.4 Agents Resource
   * An LRS's Agents API upon processing a successful GET request returns a Person Object based on matched data from the "agent" parameter and code 200 OK
   */
  it('An LRS\'s Agent Resource upon processing a successful GET request returns a Person Object if the "agent" parameter can be found in the LRS and code 200 OK (Communication 2.4.s2.table1.row1, XAPI-00248)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      let parameters = {
        agent: statement.actor,
      };
      return helper.sendRequest("get", helper.getEndpointAgents(), parameters, undefined, 200).then((res) => {
        expect((res.body as Record<string, unknown>)["objectType"]).toEqual("Person");
        expect(!!res.body && typeof res.body === "object").toBe(true);
      });
    });
  });

  /**  XAPI-00243, Communication 2.4 Agents Resource
   * An LRS's Agents API rejects a GET request without "agent" as a parameter with error code 400 Bad Request
   */
  it('An LRS\'s Agents Resource rejects a GET request without "agent" as a parameter with error code 400 Bad Request (multiplicity, Communication 2.4.s2.table1.row1, XAPI-00243)', () => {
    return helper.sendRequest("get", helper.getEndpointAgents(), undefined, undefined, 400);
  });

  /**  XAPI-00237, Communication 2.4 Agents Resource
   * A Person Object's "objectType" property is a String and is "Person" The LRS must return a valid “objectType” string.
   */
  it('A Person Object\'s "objectType" property is a String and is "Person" (Format, Vocabulary, Communication 2.4.s5.table1.row1, XAPI-00237)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("objectType");
          expect(person.objectType).toEqual("Person");
        });
    });
  });

  /**  XAPI-00238, Agents Resource
   * A Person Object's "name" property is an Array of Strings. The LRS must return a “name” property with a valid Array of Strings, if present.
   */
  it('A Person Object\'s "name" property is an Array of Strings (Multiplicity, Communication 2.4.s5.table1.row2, XAPI-00238)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("name");
          expect(Array.isArray(person.name)).toBe(true);
          person.name!.forEach((item: string) => {
            expect(typeof item).toBe("string");
          });
        });
    });
  });

  /**  XAPI-00239, Communication 2.4 Agents Resource
   * A Person Object's "mbox" property is an Array of IRIs. The LRS must return an “mbox” property with a valid array of IRIs, if present.
   */
  it('A Person Object\'s "mbox" property is an Array of IRIs (Multiplicity, Communication 2.4.s5.table1.row3, XAPI-00239)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);
    let MAIL_TO = "mailto:";
    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("mbox");
          expect(Array.isArray(person.mbox)).toBe(true);
          person.mbox!.forEach((item: string) => {
            expect(typeof item).toBe("string");
            let email = item.substring(MAIL_TO.length);
            expect(isValidEmailAddress(email)).toBe(true);
          });
        });
    });
  });

  /**  XAPI-00244, Communication 2.4 Agents Resource
   * A Person Object's "mbox" entries have the form "mailto:emailaddress". The LRS must return a Person Object which has a “mbox” value with the form "mailto:emailaddress"
   */
  it('A Person Object\'s "mbox" entries have the form "mailto:emailaddress" (Format, Communication 2.4.s5.table1.row3, XAPI-00244)', () => {
    let templates = [{ statement: "{{statements.default}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("mbox");
          expect(Array.isArray(person.mbox)).toBe(true);
          person.mbox!.forEach((item: string) => {
            expect(typeof item).toBe("string");
            expect(item).toMatch(/^mailto:/);
          });
        });
    });
  });

  /**  XAPI-00240, Communication 2.4 Agents Resource
   * A Person Object's "mbox_sha1sum" property is an Array of Strings. The LRS must return a Person Object which has a “mbox_sha1sum” and is valid array of strings, if present.
   */
  it('A Person Object\'s "mbox_sha1sum" property is an Array of Strings (Multiplicity, Communication 2.4.s5.table1.row4, XAPI-00240)', () => {
    let templates = [{ statement: "{{statements.no_actor}}" }, { actor: "{{agents.mbox_sha1sum}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("mbox_sha1sum");
          expect(Array.isArray(person.mbox_sha1sum)).toBe(true);
          person.mbox_sha1sum!.forEach((item: string) => {
            expect(typeof item).toBe("string");
          });
        });
    });
  });

  /**  XAPI-00241, Communication 2.4 Agents Resource
   * A Person Object's "openid" property is an Array of Strings The LRS must return a “openid” value which is valid array of strings, if present.
   */
  it('A Person Object\'s "openid" property is an Array of Strings (Multiplicity, Communication 2.4.s5.table1.row5, XAPI-00241)', () => {
    let templates = [{ statement: "{{statements.no_actor}}" }, { actor: "{{agents.openid}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("openid");
          expect(Array.isArray(person.openid)).toBe(true);
          person.openid!.forEach((item: string) => {
            expect(typeof item).toBe("string");
          });
        });
    });
  });

  /**  XAPI-00242, Communication 2.4 Agents Resource
   * A Person Object's "account" property is an Array of Account Objects The LRS must return a Person Object with a “name” value which is a valid array of account objects, if present.
   */
  it('A Person Object\'s "account" property is an Array of Account Objects (Multiplicity, Communication 2.4.s5.table1.row6, XAPI-00242)', () => {
    let templates = [{ statement: "{{statements.no_actor}}" }, { actor: "{{agents.account}}" }];
    const statement = createStatement(helper, templates);

    return helper.sendRequest("post", helper.getEndpointStatements(), undefined, [statement], 200).then(() => {
      return helper
        .sendRequest("get", helper.getEndpointAgents(), { agent: statement.actor }, undefined, 200)
        .then((res) => {
          let person = res.body as PersonObject;
          expect(person).toHaveProperty("account");
          expect(Array.isArray(person.account)).toBe(true);
          person.account!.forEach((item: { homePage?: string; name?: string }) => {
            expect(!!item && typeof item === "object").toBe(true);
          });
        });
    });
  });

  /**  XAPI-00249, Communication 2.4 Agents Resource
   * An LRSs Agents API rejects a GET request with "agent" as a parameter if it is not a valid (in structure) Agent with error code 400 Bad Request (XAPI-00249)
   */
  it('An LRSs Agents Resource rejects a GET request with "agent" as a parameter if it is not a valid, in structure, Agent with error code 400 Bad Request (Communication 2.4, XAPI-00249)', () => {
    let parameter = helper.buildAgent();
    delete (parameter.agent as { account?: unknown }).account;
    return helper.sendRequest("get", helper.getEndpointAgents(), parameter, undefined, 400);
  });
});
