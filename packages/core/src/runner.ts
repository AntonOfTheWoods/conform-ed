export type RunnerResult = { status: "passed" | "failed" | "error" };

export async function runSuiteStub(): Promise<RunnerResult> {
  return { status: "passed" };
}
