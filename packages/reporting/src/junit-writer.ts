import { writeFileSync } from "node:fs";

export function writeJunit(path: string): void {
  writeFileSync(path, '<testsuite tests="0" failures="0" skipped="0"></testsuite>\n');
}
