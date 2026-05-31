import {
  afterAll as bunAfterAll,
  afterEach as bunAfterEach,
  beforeAll as bunBeforeAll,
  beforeEach as bunBeforeEach,
  describe as bunDescribe,
  expect as bunExpect,
  it as bunIt,
  test as bunTest,
} from "bun:test";

type HookFunction = (...args: unknown[]) => unknown;
type SuiteFunction = (name: string, fn: (...args: unknown[]) => unknown) => unknown;

function resolveGlobalHook(name: "before" | "after"): HookFunction | undefined {
  const value = (globalThis as Record<string, unknown>)[name];
  return typeof value === "function" ? (value as HookFunction) : undefined;
}

function resolveGlobalSuite(name: "describe" | "it" | "test"): SuiteFunction | undefined {
  const value = (globalThis as Record<string, unknown>)[name];
  return typeof value === "function" ? (value as SuiteFunction) : undefined;
}

export const describe = ((name: string, fn: (...args: unknown[]) => unknown) => {
  const globalDescribe = resolveGlobalSuite("describe");
  if (globalDescribe) {
    return globalDescribe(name, fn);
  }

  return bunDescribe(name, fn as unknown as Parameters<typeof bunDescribe>[1]);
}) as unknown as typeof bunDescribe;

export const it = ((name: string, fn: (...args: unknown[]) => unknown) => {
  const globalIt = resolveGlobalSuite("it");
  if (globalIt) {
    return globalIt(name, fn);
  }

  return bunIt(name, fn as unknown as Parameters<typeof bunIt>[1]);
}) as unknown as typeof bunIt;

export const test = ((name: string, fn: (...args: unknown[]) => unknown) => {
  const globalTest = resolveGlobalSuite("test") ?? resolveGlobalSuite("it");
  if (globalTest) {
    return globalTest(name, fn);
  }

  return bunTest(name, fn as unknown as Parameters<typeof bunTest>[1]);
}) as unknown as typeof bunTest;

export const beforeAll = ((...args: unknown[]) => {
  const globalBefore = resolveGlobalHook("before");
  if (globalBefore) {
    return globalBefore(...args);
  }

  return (bunBeforeAll as unknown as HookFunction)(...args);
}) as unknown as typeof bunBeforeAll;

export const beforeEach = ((...args: unknown[]) => {
  const globalBefore = resolveGlobalHook("before");
  if (globalBefore) {
    return globalBefore(...args);
  }

  return (bunBeforeEach as unknown as HookFunction)(...args);
}) as unknown as typeof bunBeforeEach;

export const afterAll = ((...args: unknown[]) => {
  const globalAfter = resolveGlobalHook("after");
  if (globalAfter) {
    return globalAfter(...args);
  }

  return (bunAfterAll as unknown as HookFunction)(...args);
}) as unknown as typeof bunAfterAll;

export const afterEach = ((...args: unknown[]) => {
  const globalAfter = resolveGlobalHook("after");
  if (globalAfter) {
    return globalAfter(...args);
  }

  return (bunAfterEach as unknown as HookFunction)(...args);
}) as unknown as typeof bunAfterEach;

export const expect = bunExpect;
