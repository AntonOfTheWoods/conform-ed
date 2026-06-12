import { resolve } from "node:path";

export type LrsSpecVersion = "1.0.3" | "2.0.0";

export interface LrsRunConfig {
  baseUrl: string;
  directory?: string[] | undefined;
  file?: string[] | undefined;
  grep?: string | undefined;
  password?: string | undefined;
  timeoutMs?: number | undefined;
  username?: string | undefined;
  version: LrsSpecVersion;
}

export interface LrsRunExecution {
  command: string[];
  exitCode: number;
  stderr: string;
  stdout: string;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

function parseTimeoutMs(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export async function runLrs(config: LrsRunConfig): Promise<LrsRunExecution> {
  const baseUrl = trimTrailingSlash(config.baseUrl);
  const runtimeRoot = resolve(import.meta.dir, "..", "runtime");
  const command = [
    "bun",
    "run",
    resolve(runtimeRoot, "bin", "console_runner.ts"),
    "--endpoint",
    baseUrl,
    "--xapiVersion",
    config.version,
  ];

  if (config.username && config.password) {
    command.push("--basicAuth", "--authUser", config.username, "--authPassword", config.password);
  }

  if (config.grep) {
    command.push("--grep", config.grep);
  }

  if (config.directory && config.directory.length > 0) {
    command.push("--directory", config.directory.join(","));
  }

  if (config.file && config.file.length > 0) {
    command.push("--file", config.file.join(","));
  }

  const timeoutMs = config.timeoutMs ?? parseTimeoutMs(process.env["LRS_RUN_TIMEOUT_MS"]);
  const childProcess = Bun.spawn(command, {
    cwd: runtimeRoot,
    env: {
      ...process.env,
      LRS_ENDPOINT: baseUrl,
      XAPI_VERSION: config.version,
    },
    stderr: "pipe",
    stdout: "pipe",
  });

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  if (timeoutMs && timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      childProcess.kill("SIGTERM");
    }, timeoutMs);
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(childProcess.stdout).text(),
    new Response(childProcess.stderr).text(),
    childProcess.exited,
  ]);

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  return {
    command,
    exitCode: timedOut ? 124 : exitCode,
    stderr: timedOut ? `${stderr}\nRun timed out after ${timeoutMs}ms.` : stderr,
    stdout,
  };
}
