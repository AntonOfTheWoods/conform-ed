import { formatQtiPackageValidationResult, qtiValidatePackageCommand } from "../packages/cli/src";

function usage(): string {
  return ["Usage:", "  bun run qti:validate:package -- <package-directory-or-zip> [--json]"].join("\n");
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function firstPositional(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith("--"));
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const packagePath = firstPositional(args);
  const json = hasFlag(args, "--json");

  if (hasFlag(args, "--help") || !packagePath) {
    console.log(usage());
    return packagePath ? 0 : 1;
  }

  const result = await qtiValidatePackageCommand(packagePath);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatQtiPackageValidationResult(result));
  }

  return result.status === "valid" ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
