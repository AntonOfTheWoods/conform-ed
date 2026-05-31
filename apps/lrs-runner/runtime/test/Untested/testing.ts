/*
    JSON never specifies about duplicate keys and while many parsers
    automatically remove or merge such can not be relied upon, and the
    best indication from the xAPI spec is that malformed statements
    should be rejected
    */
import { describe, it } from "../bun-test.ts";

describe("These test requirements may or may not be required by the spec but nonetheless have no testing procedure associated with them as of yet", () => {
  it("An LRS implements all of the Statement, State, Agent, and Activity Profile sub-APIs **Implicit**", async () => {});

  it('A "more" property IRL is accessible for at least 24 hours after being returned (4.2.a)', async () => {});

  it("A Document Merge is defined by the merging of an existing document at an endpoint with a document received in a POST request. (7.3)", async () => {});

  it("A Document Merge de-serializes all Objects represented by each document before making other changes. (7.3.d)", async () => {});

  it("A Document Merge re-serializes all Objects to finalize a single document (7.3.d)", async () => {});

  it("In this suite, the IRI check focuses on string typing for this version", async () => {});

  it('NOTE: **There is no requirement here that the LRS reacts to the "since" parameter in the case of a GET request with valid "stateId" - this is intentional**', async () => {});

  it("A Cross Origin Request is defined as this POST request as described in the previous requirement (definition)", async () => {});

  it("An LRS rejects a Statement due to size if the Statement exceeds the size limit the LRS is configured to with error code 413 Request Entity Too Large (7.1)", async () => {});

  it("An LRS rejects a Statement due to network/server issues with an error code of 500 Internal Server Error (7.1)", async () => {});

  it('An LRS\'s Statement API, upon receiving a Get request, had a field in the header with name "Content-Type" ***Assumed?***', async () => {});

  it('An LRS rejects with error code 400 Bad Request, a PUT or POST Request which uses Attachments, has a "Content Type" header with value "multipart/mixed", and does not have a body header named "MIME-Version" with a value of "1.0" or greater (4.1.11.b, RFC 1341)', async () => {});

  it("An LRS's Statement API rejects with Error Code 400 Bad Request any DELETE request (7.2)", async () => {});

  it('A POST request is defined as a "pure" POST, as opposed to a GET taking on the form of a POST (7.2.2.e)', async () => {});
});
