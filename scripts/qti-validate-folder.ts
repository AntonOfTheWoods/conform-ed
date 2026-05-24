import { formatQtiFolderValidationSummary, qtiValidateFolderCommand } from "../packages/cli/src";

function usage(): string {
  return ["Usage:", "  bun run qti:validate:folder -- <path> [--json]"].join("\n");
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function firstPositional(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith("--"));
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const folderPath = firstPositional(args);
  const json = hasFlag(args, "--json");

  if (hasFlag(args, "--help") || !folderPath) {
    console.log(usage());
    return folderPath ? 0 : 1;
  }

  const result = await qtiValidateFolderCommand(folderPath);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatQtiFolderValidationSummary(result));
  }

  return result.invalid === 0 && result.parseErrors === 0 && result.unsupported === 0 ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
