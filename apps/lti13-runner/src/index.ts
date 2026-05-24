import { sharedCommands } from "@conform-ed/cli";
import { runLti13, validateLti13Config } from "./run";
import { lti13Targets } from "./targets";
import { lti13RunnerVersion } from "./version";

const suiteName = "lti13";
const command = process.argv[2] ?? "help";

function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

function configPathArg(): string | null {
  const configFlag = process.argv.findIndex((arg) => arg === "--config");
  if (configFlag >= 0) {
    const candidate = process.argv[configFlag + 1];
    return candidate ?? null;
  }

  const envPath = process.env.CONFORM_ED_CONFIG?.trim();
  return envPath && envPath.length > 0 ? envPath : null;
}

async function main(): Promise<void> {
  switch (command) {
    case "run": {
      const configPath = configPathArg();
      if (!configPath) {
        printJson({
          suite: suiteName,
          command,
          status: "error",
          code: "missing_config",
          message: "Provide --config <path> or CONFORM_ED_CONFIG",
        });
        return;
      }

      const result = await runLti13(configPath);
      printJson({ suite: suiteName, command, configPath, ...result });
      return;
    }
    case "validate-config": {
      const configPath = configPathArg();
      if (!configPath) {
        printJson({
          suite: suiteName,
          command,
          valid: false,
          code: "missing_config",
          message: "Provide --config <path> or CONFORM_ED_CONFIG",
        });
        return;
      }

      const result = await validateLti13Config(configPath);
      printJson({ suite: suiteName, command, configPath, ...result });
      return;
    }
    case "print-schema":
      printJson({ suite: suiteName, command, schema: "schemas/v1/config.schema.json" });
      return;
    case "list-targets":
      printJson({ suite: suiteName, command, targets: lti13Targets });
      return;
    case "list-adapters":
      printJson({ suite: suiteName, command, adapters: ["http"] });
      return;
    case "version":
      printJson({ suite: suiteName, command, version: lti13RunnerVersion });
      return;
    default:
      printJson({
        suite: suiteName,
        command: "help",
        supportedCommands: [...sharedCommands, "list-adapters"],
      });
      return;
  }
}

await main();
