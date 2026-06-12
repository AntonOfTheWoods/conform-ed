import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const repoRoot = resolve(import.meta.dir, "..");
export const tmpRoot = resolve(repoRoot, "tmp");

export function readFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]?.trim();
  if (!value) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

export function parsePort(rawValue: string, flag: string): number {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${flag} must be an integer between 1 and 65535.`);
  }

  return parsed;
}

export function resolveRepoPath(pathValue: string): string {
  return resolve(repoRoot, pathValue);
}

export function resolveTmpArtifactPath(pathValue: string, flag: string): string {
  const resolvedPath = resolve(repoRoot, pathValue);
  const allowedPrefix = `${tmpRoot}/`;

  if (resolvedPath !== tmpRoot && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error(`${flag} must point to a file under ${tmpRoot}.`);
  }

  return resolvedPath;
}

export async function waitForAdapter(baseUrl: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Continue retrying until timeout.
    }

    await Bun.sleep(250);
  }

  return false;
}

export function spawnReferenceAdapter(adapterPort: number, adapterToken: string) {
  return spawn("bun", ["--cwd", "apps/cmi5-adapter-reference", "src/index.ts"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(adapterPort),
      ADAPTER_AUTH_TOKEN: adapterToken,
    },
    stdio: "inherit",
  });
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
