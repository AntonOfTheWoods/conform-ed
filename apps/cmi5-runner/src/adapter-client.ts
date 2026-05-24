function authorizationHeaders(token: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    authorization: `Bearer ${token}`,
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
