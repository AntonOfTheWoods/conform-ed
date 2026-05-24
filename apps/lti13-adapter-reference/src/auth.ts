type AuthErrorCode = "adapter_token_missing" | "unauthorized";

function authRequired(): boolean {
  const raw = process.env.ADAPTER_AUTH_REQUIRED?.trim().toLowerCase();
  return !(raw === "0" || raw === "false" || raw === "no");
}

function configuredTokens(): string[] {
  const tokens = new Set<string>();

  const single = process.env.ADAPTER_AUTH_TOKEN?.trim();
  if (single) {
    tokens.add(single);
  }

  const next = process.env.ADAPTER_AUTH_TOKEN_NEXT?.trim();
  if (next) {
    tokens.add(next);
  }

  const all = process.env.ADAPTER_AUTH_TOKENS;
  if (all) {
    for (const token of all.split(",").map((value) => value.trim())) {
      if (token.length > 0) {
        tokens.add(token);
      }
    }
  }

  return [...tokens];
}

function bearerTokenFromHeader(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/iu.exec(header.trim());
  if (!match) {
    return null;
  }

  return match[1]?.trim() ?? null;
}

function jsonError(status: number, code: AuthErrorCode, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: {
      "content-type": "application/json",
      "www-authenticate": 'Bearer realm="conform-ed-adapter"',
    },
  });
}

export function requireBearer(request: Request): Response | null {
  if (!authRequired()) {
    return null;
  }

  const tokens = configuredTokens();
  if (tokens.length === 0) {
    return jsonError(500, "adapter_token_missing", "Adapter auth is required but no token is configured.");
  }

  const providedToken = bearerTokenFromHeader(request);
  if (!providedToken || !tokens.includes(providedToken)) {
    return jsonError(401, "unauthorized", "Bearer token required.");
  }

  return null;
}
