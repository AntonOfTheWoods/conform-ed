export type SuiteStatus = "" | "cancelled" | "passed" | "failed";

export type SuiteLike = {
  status?: SuiteStatus;
  tests: Array<{
    status: SuiteStatus;
  }>;
};

/*
 * A suite will pass if all its tests pass.
 * A suite will fail if at least one of its tests fails.
 * A suite will be cancelled if no tests fail and at least one test is cancelled.
 */
export function mustPassAll(suite: SuiteLike): SuiteStatus {
  let childStatus: SuiteStatus = "passed";

  for (const test of suite.tests) {
    if (test.status === "failed") {
      childStatus = "failed";
      break;
    }

    if (test.status === "cancelled") {
      childStatus = "cancelled";
    }
  }

  return suite.status || childStatus;
}

export default {
  mustPassAll,
};
