export async function fetchAdapterCapabilities(adapterUrl: string, token: string): Promise<Response> {
  return fetch(new URL("/v1/capabilities", adapterUrl), {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}
