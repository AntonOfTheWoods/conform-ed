/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xAPI_LRS_Test/blob/master/TestingRequirements.md
 *
 * https://github.com/adlnet/xAPI_LRS_Test/blob/master/TestingRequirements.md
 *
 */
// defines overwriting data
let INVALID_DATE = "01/011/2015";
let INVALID_STRING = "should fail";
let INVALID_DATE_00 = "2008-09-15T15:53:00.601-00";
let INVALID_DATE_0000 = "2008-09-15T15:53:00.601-0000";
let INVALID_DATE_00_00 = "2008-09-15T15:53:00.601-00:00";

// configures tests
export const config = () => {
  return [
    {
      /**  XAPI-00123, Data 4.5 ISO8601 Timestamps
       * A Timestamp must conform to ISO 8601 Date format. An LRS rejects a statement with a Timestamp which doesn’t validate to ISO 8601 Extended or ISO 8601 Basic.
       */
      name: "A TimeStamp is defined as a Date/Time formatted according to ISO 8601 (Format, Data 4.5.s1.b1, ISO8601, XAPI-00123)",
      config: [
        {
          name: 'statement "template" invalid string in timestamp',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_STRING }],
          expect: [400],
        },
        {
          name: 'statement "template" invalid date in timestamp',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE }],
          expect: [400],
        },
        {
          name: 'statement "template" invalid date in timestamp: did not reject statement timestmap with -00 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_00 }],
          expect: [400],
        },
        {
          name: 'statement "template" invalid date in timestamp: did not reject statement timestmap with -0000 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_0000 }],
          expect: [400],
        },
        {
          name: 'statement "template" invalid date in timestamp: did not reject statement timestmap with -00:00 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_00_00 }],
          expect: [400],
        },
        {
          name: 'substatement "template" invalid string in timestamp',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_STRING }],
          expect: [400],
        },
        {
          name: 'substatement "template" invalid date in timestamp',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE }],
          expect: [400],
        },
        {
          name: 'substatement "template" invalid date in timestamp: did not reject substatement timestamp with -00 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_00 }],
          expect: [400],
        },
        {
          name: 'substatement "template" invalid date in timestamp: did not reject substatement timestamp with  -0000 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_0000 }],
          expect: [400],
        },
        {
          name: 'substatement "template" invalid date in timestamp: did not reject substatement timestamp with  -00:00 offset',
          templates: [{ statement: "{{statements.default}}" }, { timestamp: INVALID_DATE_00_00 }],
          expect: [400],
        },
      ],
    },
  ];
};
export default { config };
