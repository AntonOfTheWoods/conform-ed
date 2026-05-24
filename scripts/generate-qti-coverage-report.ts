import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { formatQtiCoverageReport, qtiCoverageReportCommand } from "../packages/cli/src";

function usage(): string {
  return [
    "Usage:",
    "  bun run qti:coverage:report -- [--root <path>] [--out <path>] [--json]",
    "",
    "Defaults:",
    "  --root tmp/qti-examples",
    "  --out tmp/generated/qti/qti-coverage-report.json",
  ].join("\n");
}

function parseFlagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const rootPath = parseFlagValue(args, "--root") ?? "tmp/qti-examples";
  const outputPath = parseFlagValue(args, "--out") ?? "tmp/generated/qti/qti-coverage-report.json";
  const json = hasFlag(args, "--json");

  if (hasFlag(args, "--help")) {
    console.log(usage());
    return 0;
  }

  const report = await qtiCoverageReportCommand(rootPath);
  const absoluteOutputPath = resolve(outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (json) {
    console.log(
      JSON.stringify({ outputPath: absoluteOutputPath, validationSummary: report.validationSummary }, null, 2),
    );
    return 0;
  }

  console.log(formatQtiCoverageReport(report));
  console.log(`\nWrote: ${absoluteOutputPath}`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
