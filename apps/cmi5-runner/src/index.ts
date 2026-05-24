import { sharedCommands } from "@conform-ed/cli";

const suiteName = "cmi5";
const command = process.argv[2] ?? "help";

function printJson(payload: unknown): void {
  console.log(JSON.stringify(payload, null, 2));
}

switch (command) {
  case "run":
    printJson({ suite: suiteName, command, status: "not_implemented" });
    break;
  case "validate-config":
    printJson({ suite: suiteName, command, valid: true });
    break;
  case "print-schema":
    printJson({ suite: suiteName, command, schema: "schemas/v1/config.schema.json" });
    break;
  case "list-targets":
    printJson({ suite: suiteName, command, targets: ["all", "smoke"] });
    break;
  case "list-adapters":
    printJson({ suite: suiteName, command, adapters: ["http"] });
    break;
  case "version":
    printJson({ suite: suiteName, command, version: "0.1.0" });
    break;
  default:
    printJson({
      suite: suiteName,
      command: "help",
      supportedCommands: [...sharedCommands, "list-adapters"],
    });
}
