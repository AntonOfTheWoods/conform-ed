/*
    JSON never specifies about duplicate keys and while many parsers
    automatically remove or merge such can not be relied upon, and the
    best indication from the xAPI spec is that malformed statements
    should be rejected
    */
import { describe, it } from "../bun-test.ts";

describe("Welcome to Multiplicity Testing.  A Statement, Object or Verb's properties are used at most one time", () => {
  it('A Statement uses the "id" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "actor" property exactly one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "verb" property exactly one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "object" property exactly one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "result" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "context" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "timestamp" property at most one time (Multiplicity, 4.1.a)', async () => {});

  //An lrs does not accept statements with a stored property, duplicates or no.  An lrs is to assign the stored statement.

  it('A Statement uses the "stored" property at most one time (Multiplicity, 4.1.a)', async () => {});

  //LRS is accepting and putting its own stamp of approval on the statement, throwing out the authority that it was given, if it doesn't not trust the given authority.  There seems to be no rejection of a statement based on wrong/invalid/untrusted authority.

  it('A Statement uses the "authority" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "version" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement uses the "attachments" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Group uses the "name" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Group uses the "member" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An "actor" property uses the "objectType" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Agent uses the "mbox_sha1sum" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Agent uses the "openid" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Agent uses the "account" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Agent uses the "name" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Agent uses the "mbox" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Anonymous Group uses the "member" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Identified Group uses the "mbox" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Identified Group uses the "mbox_sha1sum" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Identified Group uses the "openid" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Identified Group uses the "account" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Account Object uses the "homePage" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Account Object property uses the "name" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A "verb" property uses the "id" property at most one time (Multiplicity, 4.1.3.table1.row1.aultiplicity, 4.1.a)', async () => {});

  it('A Voiding Statement\'s Target is defined as the Statement corresponding to the "object" property\'s "id" property\'s IRI (4.3.b)', async () => {});

  it('A "verb" property uses the "display" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An "object" property uses the "objectType" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An "object" property uses the "id" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An "object" property uses the "definition" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity is defined by the "objectType" of an "object" with value "Activity" (4.1.4.1.table1.row1.b)', async () => {});

  it('An Activity uses the "definition" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "name" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "description" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "type" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "moreInfo" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "interactionType" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "correctResponsesPattern" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "choices" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "scale" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "source" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "target" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "steps" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Interaction Component uses the "id" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Interaction Component uses the "description" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('An Activity Definition uses the "extensions" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A Statement Reference uses the "id" property at most one time (Multiplicity, 4.1.a)', async () => {});

  it('A "score" Object uses a "scaled" property at most one time (Multiplicity, 4.1.5.1.table1.row1.c)', async () => {});

  it('A "score" Object uses a "raw" property at most one time (Multiplicity, 4.1.5.1.table1.row3.c)', async () => {});

  it('A "score" Object uses a "min" property at most one time (Multiplicity, 4.1.5.1.table1.row3.c)', async () => {});

  it('A "score" Object uses a "max" property at most one time (Multiplicity, 4.1.5.1.table1.row4.c)', async () => {});

  it('A Statement\'s "result" property uses a "success" property at most one time (Multiplicity, 4.1.5.table1.row2.c)', async () => {});

  it('A Statement\'s "result" property uses a "completion" property at most one time (Multiplicity, 4.1.5.table1.row3.c)', async () => {});

  it('A Statement\'s "result" property uses a "response" property at most one time (Multiplicity, 4.1.5.table1.row3.c)', async () => {});

  it('A Statement\'s "result" property uses a "duration" property at most one time (Multiplicity, 4.1.5.table1.row3.c)', async () => {});

  it('A Statement\'s "result" property uses an "extensions" property at most one time (Multiplicity, 4.1.5.table1.row3.c)', async () => {});

  it('A Statement\'s "context" property uses a "registration" property at most one time (Multiplicity, 4.1.6.table1.row1.c)', async () => {});

  it('A Statement\'s "context" property uses an "instructor" property at most one time (Multiplicity, 4.1.6.table1.row2.c)', async () => {});

  it('A Statement\'s "context" property uses an "team" property at most one time (Multiplicity, 4.1.6.table1.row3.c)', async () => {});

  it('A Statement\'s "context" property uses a "contextActivities" property at most one time (Multiplicity, 4.1.6.table1.row4.c)', async () => {});

  it('A Statement\'s "context" property uses an "revision" property at most one time (Multiplicity, 4.1.6.table1.row5.c)', async () => {});

  it('A Statement\'s "context" property uses an "platform" property at most one time (Multiplicity, 4.1.6.table1.row6.c)', async () => {});

  it('A Statement\'s "context" property uses a "language" property at most one time (Multiplicity, 4.1.6.table1.row7.c)', async () => {});

  it('A Statement\'s "context" property uses a "statement" property at most one time (Multiplicity, 4.1.6.table1.row8.c)', async () => {});

  it('A Statement\'s "context" property uses an "extensions" property at most one time (Multiplicity, 4.1.6.table1.row9.c)', async () => {});

  it('An Attachment uses a "usageType" property exactly one time (Multiplicity, 4.1.11.table1.row1.c)', async () => {});

  it('An Attachment uses a "display" property exactly one time (Multiplicity, 4.1.11.table1.row2.c)', async () => {});

  it('An Attachment uses a "description" property at most one time (Multiplicity, 4.1.11.table1.row3.c)', async () => {});

  it('An Attachment uses a "contentType" property exactly one time (Multiplicity, 4.1.11.table1.row4.c)', async () => {});

  it('An Attachment uses a "length" property exactly one time (Multiplicity, 4.1.11.table1.row5.c)', async () => {});

  it('An Attachment uses a "sha2" property exactly one time (Multiplicity, 4.1.11.table1.row6.c)', async () => {});

  it('An Attachment uses a "fileUrl" property at most one time (Multiplicity, 4.1.11.table1.row7.c)', async () => {});

  it('An LRS\'s Statement API, upon processing a successful GET request, will return a single "statements" property (Multiplicity, Format, 4.2.table1.row1.c)', async () => {});

  it('A Person Object uses an "objectType" property exactly one time (Multiplicity, 7.6.table1.row1.c)', async () => {});

  it('A Person Object uses a "name" property at most one time (Multiplicity, 7.6.table1.row2.c)', async () => {});

  it('A Person Object uses a "mbox" property at most one time (Multiplicity, 7.6.table1.row3.c)', async () => {});

  it('A Person Object uses a "mbox_sha1sum" property at most one time (Multiplicity, 7.6.table1.row4.c)', async () => {});

  it('A Person Object uses an "openid" property at most one time (Multiplicity, 7.6.table1.row5.c)', async () => {});

  it('A Person Object uses an "account" property at most one time (Multiplicity, 7.6.table1.row6.c)', async () => {});

  it('An LRS\'s State API can process a DELETE request with "since" as a parameter (multiplicity, 7.4.table2.row4.b, 7.4.table2.row3.b)', async () => {});
});
