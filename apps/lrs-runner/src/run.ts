export type LrsSpecVersion = "1.0.3" | "2.0.0";

export interface LrsRunConfig {
  baseUrl: string;
  password?: string;
  timeoutMs?: number;
  username?: string;
  version: LrsSpecVersion;
}

export interface LrsRunEvent {
  kind: "request" | "response" | "result";
  message: string;
  at: string;
  status?: number;
}

export interface LrsRunResult {
  generatedAt: string;
  root: {
    status: "passed" | "failed";
    children: Array<{ title: string; status: "passed" | "failed" }>;
  };
  run: {
    events: LrsRunEvent[];
    status: "passed" | "failed";
    version: LrsSpecVersion;
  };
  target: {
    baseUrl: string;
    authMode: "basic" | "default";
    version: LrsSpecVersion;
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

function buildAuthHeader(username?: string, password?: string): string | undefined {
  if (!username || !password) {
    return undefined;
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export async function runLrs(config: LrsRunConfig): Promise<LrsRunResult> {
  const baseUrl = trimTrailingSlash(config.baseUrl);
  const aboutUrl = `${baseUrl}/about`;
  const startedAt = new Date().toISOString();
  const events: LrsRunEvent[] = [];
  const headers = new Headers({
    "X-Experience-API-Version": config.version,
  });
  const authorization = buildAuthHeader(config.username, config.password);

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  events.push({
    kind: "request",
    message: `GET ${aboutUrl}`,
    at: startedAt,
  });

  let response: Response;
  try {
    response = await fetch(aboutUrl, {
      headers,
      signal: config.timeoutMs ? AbortSignal.timeout(config.timeoutMs) : undefined,
    });
  } catch (error) {
    const endedAt = new Date().toISOString();
    events.push({
      kind: "result",
      message: error instanceof Error ? error.message : String(error),
      at: endedAt,
    });

    return {
      generatedAt: endedAt,
      root: {
        status: "failed",
        children: [{ title: "LRS about endpoint reachable", status: "failed" }],
      },
      run: {
        events,
        status: "failed",
        version: config.version,
      },
      target: {
        baseUrl,
        authMode: authorization ? "basic" : "default",
        version: config.version,
      },
    };
  }

  await response.text();
  const endedAt = new Date().toISOString();
  const passed = response.ok;
  events.push({
    kind: "response",
    message: `${response.status} ${response.statusText}`,
    at: endedAt,
    status: response.status,
  });
  events.push({
    kind: "result",
    message: passed ? "passed" : "failed",
    at: endedAt,
    status: response.status,
  });

  return {
    generatedAt: endedAt,
    root: {
      status: passed ? "passed" : "failed",
      children: [{ title: "LRS about endpoint reachable", status: passed ? "passed" : "failed" }],
    },
    run: {
      events,
      status: passed ? "passed" : "failed",
      version: config.version,
    },
    target: {
      baseUrl,
      authMode: authorization ? "basic" : "default",
      version: config.version,
    },
  };
}
