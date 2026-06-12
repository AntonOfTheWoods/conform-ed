import { afterEach, expect, test } from "bun:test";

import { requireBearer } from "../src/auth";

type AuthErrorBody = {
  error: {
    code: string;
  };
};

async function withEnv(
  values: Record<string, string | undefined>,
  callback: () => Promise<void> | void,
): Promise<void> {
  const previous: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const restore = (): void => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  try {
    const result = callback();
    await result;
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

afterEach(() => {
  delete process.env["ADAPTER_AUTH_REQUIRED"];
  delete process.env["ADAPTER_AUTH_TOKEN"];
  delete process.env["ADAPTER_AUTH_TOKEN_NEXT"];
  delete process.env["ADAPTER_AUTH_TOKENS"];
});

test("auth bypass works when explicitly disabled", async () => {
  await withEnv({ ADAPTER_AUTH_REQUIRED: "false" }, () => {
    const response = requireBearer(new Request("http://localhost/"));
    expect(response).toBeNull();
  });
});

test("returns structured 500 when auth required but token missing", async () => {
  await withEnv({ ADAPTER_AUTH_REQUIRED: "true", ADAPTER_AUTH_TOKEN: undefined }, async () => {
    const response = requireBearer(new Request("http://localhost/"));
    expect(response).not.toBeNull();
    expect(response?.status).toBe(500);
    expect(response?.headers.get("content-type")).toBe("application/json");

    const body = (await response?.json()) as AuthErrorBody;
    expect(body.error.code).toBe("adapter_token_missing");
  });
});

test("returns structured 401 for invalid bearer header", async () => {
  await withEnv({ ADAPTER_AUTH_TOKEN: "expected" }, async () => {
    const request = new Request("http://localhost/", {
      headers: {
        authorization: "Bearer wrong",
      },
    });

    const response = requireBearer(request);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    expect(response?.headers.get("www-authenticate")?.startsWith("Bearer")).toBeTrue();

    const body = (await response?.json()) as AuthErrorBody;
    expect(body.error.code).toBe("unauthorized");
  });
});

test("accepts token rotation via ADAPTER_AUTH_TOKEN_NEXT", async () => {
  await withEnv(
    {
      ADAPTER_AUTH_TOKEN: "active-token",
      ADAPTER_AUTH_TOKEN_NEXT: "next-token",
    },
    () => {
      const request = new Request("http://localhost/", {
        headers: {
          authorization: "Bearer next-token",
        },
      });

      const response = requireBearer(request);
      expect(response).toBeNull();
    },
  );
});
