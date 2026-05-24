function authorizationHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    authorization: `Bearer ${token}`,
  };
}

function jsonHeaders(token: string | null): Record<string, string> {
  return {
    ...authorizationHeaders(token),
    "content-type": "application/json",
  };
}

export async function fetchAdapterCapabilities(adapterUrl: string, token: string | null): Promise<Response> {
  return fetch(new URL("/v1/capabilities", adapterUrl), {
    headers: authorizationHeaders(token),
  });
}

export async function fetchAdapterProfile(adapterUrl: string, token: string | null): Promise<Response> {
  return fetch(new URL("/v1/profile", adapterUrl), {
    headers: authorizationHeaders(token),
  });
}

export async function callAdapterOperation(
  adapterUrl: string,
  operationPath: string,
  method: "GET" | "POST",
  token: string | null,
  body?: unknown,
): Promise<Response> {
  return fetch(new URL(operationPath, adapterUrl), {
    method,
    headers: body === undefined ? authorizationHeaders(token) : jsonHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
