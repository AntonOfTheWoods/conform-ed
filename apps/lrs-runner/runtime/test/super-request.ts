import crypto from "node:crypto";

export type OAuthOptions = {
  consumer_key?: string;
  consumer_secret?: string;
  token?: string;
  token_secret?: string;
  verifier?: string;
};

type HeaderMap = Record<string, string | undefined>;

export type RequestResponse = {
  body: unknown;
  headers: Record<string, string | undefined>;
  request: {
    href: string;
  };
  statusCode?: number;
  text?: string;
};

export type RequestChain = {
  _options?: {
    oauth?: OAuthOptions;
  };
  method?: string;
  url?: string;
  body(payload: string | Buffer): RequestChain;
  end(callback?: (error?: unknown, response?: RequestResponse) => void): RequestChain;
  expect(status: number, callback?: (error?: unknown, response?: RequestResponse) => void): RequestChain;
  form(value: Record<string, unknown>): RequestChain;
  headers(value: HeaderMap): RequestChain;
  json(payload: unknown): RequestChain;
  set(name: string, value: string): RequestChain;
  wait(delay: Promise<unknown> | { then?: unknown }): RequestChain;
};

export type RequestRoot = {
  get(path: string): RequestChain;
  post(path: string): RequestChain;
  put(path: string): RequestChain;
  del(path: string): RequestChain;
  delete(path: string): RequestChain;
  head(path: string): RequestChain;
};

export type RequestFactory = (endpoint: string) => RequestRoot;

export function endAsync(chain: RequestChain): Promise<RequestResponse> {
  return new Promise((resolve, reject) => {
    chain.end((error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(
        (response || {
          body: "",
          headers: {},
          request: {
            href: "",
          },
          text: "",
        }) as RequestResponse,
      );
    });
  });
}

export function expectAsync(chain: RequestChain, status: number): Promise<RequestResponse> {
  chain.expect(status);
  return endAsync(chain);
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => {
    return "%" + character.charCodeAt(0).toString(16).toUpperCase();
  });
}

function normalizeHeaders(headers: HeaderMap): Record<string, string> {
  const result: Record<string, string> = {};
  Object.keys(headers || {}).forEach((key) => {
    const value = headers[key];
    if (typeof value === "undefined") {
      return;
    }
    result[key.toLowerCase()] = String(value);
  });
  return result;
}

function parseQuery(url: string): Array<[string, string]> {
  const parsed = new URL(url);
  const params: Array<[string, string]> = [];
  parsed.searchParams.forEach((value, key) => {
    params.push([key, value]);
  });
  return params;
}

function parseFormBody(headers: Record<string, string>, body: unknown): Array<[string, string]> {
  const contentType = headers["content-type"] || "";
  if (!contentType.includes("application/x-www-form-urlencoded") || typeof body !== "string") {
    return [];
  }

  const params: Array<[string, string]> = [];
  new URLSearchParams(body).forEach((value, key) => {
    params.push([key, value]);
  });
  return params;
}

function buildOAuthAuthorizationHeader(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  oauth: OAuthOptions,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: oauth.consumer_key || "",
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauth.token || "",
    oauth_version: "1.0",
  };

  if (oauth.verifier) {
    oauthParams["oauth_verifier"] = oauth.verifier;
  }

  const allParams: Array<[string, string]> = [];
  parseQuery(url).forEach((pair) => {
    allParams.push(pair);
  });
  parseFormBody(headers, body).forEach((pair) => {
    allParams.push(pair);
  });
  Object.keys(oauthParams).forEach((key) => {
    allParams.push([key, oauthParams[key] || ""]);
  });

  const normalizedParameterString = allParams
    .map((pair) => {
      return [encodeRfc3986(pair[0]), encodeRfc3986(pair[1])];
    })
    .sort((left, right) => {
      const leftKey = left[0] ?? "";
      const leftValue = left[1] ?? "";
      const rightKey = right[0] ?? "";
      const rightValue = right[1] ?? "";

      if (leftKey === rightKey) {
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      }
      return leftKey < rightKey ? -1 : 1;
    })
    .map((pair) => {
      return pair[0] + "=" + pair[1];
    })
    .join("&");

  const parsedUrl = new URL(url);
  const baseUrl = parsedUrl.origin + parsedUrl.pathname;
  const baseString = [method.toUpperCase(), encodeRfc3986(baseUrl), encodeRfc3986(normalizedParameterString)].join("&");

  const signingKey = encodeRfc3986(oauth.consumer_secret || "") + "&" + encodeRfc3986(oauth.token_secret || "");
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams["oauth_signature"] = signature;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((key) => {
        return encodeRfc3986(key) + '="' + encodeRfc3986(oauthParams[key] || "") + '"';
      })
      .join(", ")
  );
}

function createChain(endpoint: string, method: string, path: string): RequestChain {
  const state: {
    endpoint: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: unknown;
    parseJsonResponse: boolean;
    expectedStatus: number | undefined;
    waitPromise: Promise<unknown> | { then?: unknown } | undefined;
    _options: {
      oauth?: OAuthOptions;
    };
  } = {
    endpoint,
    method,
    path,
    headers: {},
    body: undefined,
    parseJsonResponse: false,
    expectedStatus: undefined,
    waitPromise: undefined,
    _options: {},
  };

  function resolveUrl(): string {
    if (/^https?:\/\//i.test(state.path)) {
      return state.path;
    }
    const base = String(state.endpoint || "").replace(/\/+$/, "");
    const targetPath = String(state.path || "");
    if (!base) {
      return targetPath;
    }
    if (!targetPath) {
      return base;
    }
    if (targetPath.startsWith("/")) {
      return base + targetPath;
    }
    return base + "/" + targetPath;
  }

  const chain: RequestChain = {
    _options: state._options,
    method: method,
    url: resolveUrl(),
    headers: (value) => {
      state.headers = Object.assign(state.headers, normalizeHeaders(value || {}));
      return chain;
    },
    set: (name, value) => {
      state.headers[String(name).toLowerCase()] = String(value);
      return chain;
    },
    json: (payload) => {
      if (!state.headers["content-type"]) {
        state.headers["content-type"] = "application/json";
      }
      state.body = JSON.stringify(payload);
      state.parseJsonResponse = true;
      return chain;
    },
    body: (payload) => {
      state.body = Buffer.isBuffer(payload) ? payload : String(payload);
      state.parseJsonResponse = false;
      return chain;
    },
    form: (value) => {
      if (!state.headers["content-type"]) {
        state.headers["content-type"] = "application/x-www-form-urlencoded";
      }
      const searchParams = new URLSearchParams();
      Object.keys(value || {}).forEach((key) => {
        const current = value[key];
        if (typeof current === "undefined" || current === null) {
          return;
        }
        // eslint-disable-next-line typescript/no-base-to-string
        searchParams.set(key, String(current));
      });
      state.body = searchParams.toString();
      state.parseJsonResponse = false;
      return chain;
    },
    wait: (delay) => {
      if (delay && typeof delay.then === "function") {
        state.waitPromise = delay;
      }
      return chain;
    },
    expect: (status, callback) => {
      state.expectedStatus = status;
      if (typeof callback === "function") {
        chain.end(callback);
      }
      return chain;
    },
    end: (callback) => {
      const done = typeof callback === "function" ? callback : () => {};
      void (async () => {
        try {
          if (state.waitPromise) {
            await state.waitPromise;
          }

          const requestHeaders = Object.assign({}, state.headers);
          const url = resolveUrl();
          if (state._options && state._options.oauth) {
            requestHeaders["authorization"] = buildOAuthAuthorizationHeader(
              state.method,
              url,
              requestHeaders,
              state.body,
              state._options.oauth,
            );
          }

          const response = await fetch(url, {
            method: state.method,
            headers: requestHeaders,
            body:
              state.method === "GET" || state.method === "HEAD"
                ? undefined
                : (state.body as string | Buffer | Uint8Array | ArrayBuffer | null | undefined),
          });

          const text = await response.text();
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key.toLowerCase()] = value;
          });

          const responsePayload: RequestResponse = {
            body: text,
            text: text,
            headers: responseHeaders,
            request: {
              href: url,
            },
            statusCode: response.status,
          };

          const contentType = (responseHeaders["content-type"] || "").toLowerCase();
          if (state.parseJsonResponse && contentType.includes("json") && text.length > 0) {
            try {
              responsePayload.body = JSON.parse(text);
            } catch {
              // Keep legacy-compatible fallback: retain raw response text when JSON parse fails.
            }
          }

          if (typeof state.expectedStatus === "number" && response.status !== state.expectedStatus) {
            done(
              new Error("Expected response status code to be " + state.expectedStatus + " got " + response.status),
              responsePayload,
            );
            return;
          }

          done(undefined, responsePayload);
        } catch (error) {
          done(error);
        }
      })();
      return chain;
    },
  };

  return chain;
}

function createRoot(endpoint: string) {
  return {
    get: (path: string) => {
      return createChain(endpoint, "GET", path);
    },
    post: (path: string) => {
      return createChain(endpoint, "POST", path);
    },
    put: (path: string) => {
      return createChain(endpoint, "PUT", path);
    },
    del: (path: string) => {
      return createChain(endpoint, "DELETE", path);
    },
    delete: (path: string) => {
      return createChain(endpoint, "DELETE", path);
    },
    head: (path: string) => {
      return createChain(endpoint, "HEAD", path);
    },
  };
}

const requestFactory = createRoot as RequestFactory;

export default requestFactory;
