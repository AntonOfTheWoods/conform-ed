#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";

import { normalizeRunnerOptions } from "../bun-runtime/options.ts";
import { installRunnerEnvironment, registerSuiteFiles } from "../bun-runtime/suite-loader.ts";
import type { DescribeRuntime } from "../bun-runtime/runtime.ts";
import specs from "../specConfig.ts";

type BatteryTreeNode = {
  children: BatteryTreeNode[];
  text: string;
};

type BatteryInfo = {
  conformanceTestCount: number | null;
  tests: BatteryTreeNode;
};

type CollectedSuiteNode = {
  title: string;
  suites: CollectedSuiteNode[];
  tests: string[];
};

function toBatteryTreeNode(node: CollectedSuiteNode): BatteryTreeNode {
  return {
    text: node.title,
    children: [
      ...node.suites.map(toBatteryTreeNode),
      ...node.tests.map((testTitle) => ({
        text: testTitle,
        children: [],
      })),
    ],
  };
}

function countTests(node: CollectedSuiteNode): number {
  return node.tests.length + node.suites.reduce((sum, childSuite) => sum + countTests(childSuite), 0);
}

function createCollectorRuntime(root: CollectedSuiteNode): DescribeRuntime {
  const stack: CollectedSuiteNode[] = [root];
  const noopContext = {
    retries: (_count: number) => {},
    slow: (_ms: number) => {},
    timeout: (_ms: number) => {},
  };

  const current = (): CollectedSuiteNode => {
    const node = stack[stack.length - 1];
    if (!node) {
      throw new Error("Collector runtime stack is empty.");
    }

    return node;
  };

  return {
    before: (() => {}) as DescribeRuntime["before"],
    describe: (title, build) => {
      const node: CollectedSuiteNode = {
        title,
        suites: [],
        tests: [],
      };

      current().suites.push(node);
      stack.push(node);
      try {
        build.call(noopContext);
      } finally {
        stack.pop();
      }
    },
    getSummary: () => undefined,
    it: (title) => {
      current().tests.push(title);
    },
    run: async () => {
      throw new Error("Collector runtime does not execute test bodies.");
    },
  };
}

export function isSuiteDefinitionFile(fileName: string): boolean {
  return fileName.endsWith(".js") || fileName.endsWith(".ts");
}

export function listSuiteDefinitionFiles(testDirectory: string): string[] {
  return fs
    .readdirSync(testDirectory)
    .filter((file) => isSuiteDefinitionFile(file))
    .sort((left, right) => left.localeCompare(right));
}

async function createBattery(version: string): Promise<BatteryInfo> {
  const runtimeRoot = path.join(__dirname, "..");
  const directory = version === "1.0.3" ? "v1_0_3" : "v2_0";
  const root: CollectedSuiteNode = {
    title: "",
    suites: [],
    tests: [],
  };
  const runtime = createCollectorRuntime(root);
  const normalizedOptions = normalizeRunnerOptions({
    xapiVersion: version,
    endpoint: "http://localhost:3001/xapi",
    directory: [directory],
    basicAuth: true,
    authUser: "No:",
    authPass: "User",
  });
  const restoreEnvironment = installRunnerEnvironment(normalizedOptions);

  try {
    await registerSuiteFiles({
      normalizedOptions,
      runtime,
      runtimeRoot: runtimeRoot,
    });
  } finally {
    restoreEnvironment();
  }

  const info = {
    conformanceTestCount: countTests(root),
    tests: toBatteryTreeNode(root),
  };

  console.log(`[${version}] found ${info.conformanceTestCount} tests.`);

  return info;
}

async function createBatteries(): Promise<Record<string, BatteryInfo>> {
  const output: Record<string, BatteryInfo> = {};
  for (const version of specs.availableVersions) {
    output[version] = await createBattery(version);
  }

  return output;
}

function serializeBatteriesModule(batteryOutput: Record<string, BatteryInfo>): string {
  return [
    "export type BatteryTreeNode = {",
    "  children: BatteryTreeNode[];",
    "  text: string;",
    "};",
    "",
    "export type BatteryInfo = {",
    "  conformanceTestCount: number | null;",
    "  tests: BatteryTreeNode;",
    "};",
    "",
    `const batteries = ${JSON.stringify(batteryOutput, null, 2)} as Record<string, BatteryInfo>;`,
    "",
    "export default batteries;",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const batteryOutput = await createBatteries();
  const batteryPath = path.join(__dirname, "../batteries.ts");
  const fileContents = serializeBatteriesModule(batteryOutput);

  fs.writeFileSync(batteryPath, fileContents);
}

if (import.meta.main) {
  void main();
}
