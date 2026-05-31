# LRS Conformance Test Suite

### Description

This is a Bun/TypeScript runtime of the original NodeJS conformance suite (https://github.com/adlnet/lrs-conformance-test-suite) that tests the 'MUST' requirements of the xAPI Spec, determined by the governing documents for the various versions of the xAPI Spec. This is actively being developed and new tests will be periodically added based on the testing requirements. Currently, this test suite only supports basic authentication. This test suite should also not run against a production LRS endpoint because the data is persisted and never voided.

- For xAPI versions 1.0.3 and earlier, the documentation can be found on the **[ADL Initiative GitHub repository](https://github.com/adlnet/xAPI-Spec)**
- For xAPI versions 2.0 and later, these will be hosted on the **[IEEE GitLab repository](https://opensource.ieee.org/xapi/xapi-base-standard-documentation)**

### xAPI 2.0 Update

xAPI 2.0 changed a number of requirements for the LRS from previous versions; most of these are additions supporting new features, while others have been removed. The details of the changes may be seen in the updated xAPI Spec.

The following are the major changes that warranted the creation of additional tests in the conformance suite:

- Full support and validation for context agents and context groups
- 2.0.x is a valid set of xAPI versions
- Timestamps may be represented in the RFC 3339 format (changed from strict ISO 8601)
- If a timestamp is not formatted to UTC, the LRS will convert the timestamp instead of rejecting the statement
- Alternate Request Syntax is no longer supported and therefore not tested
- LRS responses now include `Last-Modified` headers
