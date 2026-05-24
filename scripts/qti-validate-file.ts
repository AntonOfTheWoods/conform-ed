import { formatQtiValidationResult, qtiValidateFileCommand } from "../packages/cli/src";

function usage(): string {
  return ["Usage:", "  bun run qti:validate:file -- <path> [--json]"].join("\n");
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function firstPositional(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith("--"));
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const filePath = firstPositional(args);
  const json = hasFlag(args, "--json");

  if (hasFlag(args, "--help") || !filePath) {
    console.log(usage());
    return filePath ? 0 : 1;
  }

  const result = await qtiValidateFileCommand(filePath);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatQtiValidationResult(result));
  }

  return result.status === "valid" ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
