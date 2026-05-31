import crypto from "node:crypto";

import helperExports from "../../helper.ts";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type QueryValue = string | number | boolean | undefined;

const oldHelpers = helperExports as {
  generateUUID(): string;
  getUrlEncoding(params: Record<string, QueryValue>): string;
  signStatement(statement: Record<string, JsonValue>, options: { boundary: string }): Promise<Buffer>;
};

type HeaderOverrides = Record<string, string> | undefined;
type QueryParams = Record<string, QueryValue>;
type RequestBody = string | Buffer | Uint8Array | ArrayBuffer;
type ResponseHeaders = {
  [key: string]: string | undefined | ((name: string) => string | undefined);
  get(name: string): string | undefined;
};
type HttpResponse = {
  status: number;
  data: JsonValue;
  headers: ResponseHeaders;
};

const LRS_ENDPOINT = process.env["LRS_ENDPOINT"] ?? "";
const PATH_ACTIVITIES = "/activities";
const PATH_ACTIVITIES_PROFILE = "/activities/profile";
const PATH_ACTIVITIES_STATE = "/activities/state";
const PATH_AGENTS_PROFILE = "/agents/profile";
const PATH_STATEMENTS = "/statements";

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Experience-API-Version": process.env["XAPI_VERSION"] ?? "",
};

if (process.env["OAUTH1_ENABLED"] !== "true") {
  const user = process.env["BASIC_AUTH_USER"];
  const pass = process.env["BASIC_AUTH_PASSWORD"];
  BASE_HEADERS["Authorization"] = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, function (character) {
    return "%" + character.charCodeAt(0).toString(16).toUpperCase();
  });
}

function parseQuery(url: string): Array<[string, string]> {
  const parsed = new URL(url);
  const params: Array<[string, string]> = [];
  parsed.searchParams.forEach(function (value, key) {
    params.push([key, value]);
  });
  return params;
}

function parseFormBody(headers: Record<string, string>, body: RequestBody | undefined): Array<[string, string]> {
  const contentType = (headers["Content-Type"] || headers["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/x-www-form-urlencoded") || typeof body !== "string") {
    return [];
  }

  const params: Array<[string, string]> = [];
  new URLSearchParams(body).forEach(function (value, key) {
    params.push([key, value]);
  });
  return params;
}

function buildOAuthAuthorizationHeader(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: RequestBody | undefined,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: process.env["OAUTH1_CONSUMER_KEY"] ?? "",
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: process.env["OAUTH1_TOKEN"] ?? "",
    oauth_version: "1.0",
  };

  const verifier = process.env["OAUTH1_VERIFIER"];
  if (verifier) {
    oauthParams["oauth_verifier"] = verifier;
  }

  const allParams: Array<[string, string]> = [];
  parseQuery(url).forEach(function (pair) {
    allParams.push(pair);
  });
  parseFormBody(headers, body).forEach(function (pair) {
    allParams.push(pair);
  });
  Object.keys(oauthParams).forEach(function (key) {
    allParams.push([key, oauthParams[key] ?? ""]);
  });

  const normalizedParameterString = allParams
    .map(function (pair) {
      return [encodeRfc3986(pair[0]), encodeRfc3986(pair[1])];
    })
    .sort(function (left, right) {
      const leftKey = left[0] ?? "";
      const leftValue = left[1] ?? "";
      const rightKey = right[0] ?? "";
      const rightValue = right[1] ?? "";

      if (leftKey === rightKey) {
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      }
      return leftKey < rightKey ? -1 : 1;
    })
    .map(function (pair) {
      return pair[0] + "=" + pair[1];
    })
    .join("&");

  const parsedUrl = new URL(url);
  const baseUrl = parsedUrl.origin + parsedUrl.pathname;
  const baseString = [method.toUpperCase(), encodeRfc3986(baseUrl), encodeRfc3986(normalizedParameterString)].join("&");

  const signingKey =
    encodeRfc3986(process.env["OAUTH1_CONSUMER_SECRET"] ?? "") +
    "&" +
    encodeRfc3986(process.env["OAUTH1_TOKEN_SECRET"] ?? "");

  oauthParams["oauth_signature"] = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map(function (key) {
        return encodeRfc3986(key) + '="' + encodeRfc3986(oauthParams[key] ?? "") + '"';
      })
      .join(", ")
  );
}

function parseResponseData(contentType: string, text: string): JsonValue {
  if (contentType.toLowerCase().includes("json") && text.length > 0) {
    try {
      return JSON.parse(text) as JsonValue;
    } catch {
      return text;
    }
  }
  return text;
}

function toResponseHeaders(headers: Headers): ResponseHeaders {
  const normalized: Record<string, string> = {};
  headers.forEach(function (value, key) {
    normalized[key.toLowerCase()] = value;
  });

  return {
    ...normalized,
    get(name: string): string | undefined {
      return normalized[name.toLowerCase()];
    },
  };
}

async function sendRequest(
  method: string,
  url: string,
  body?: RequestBody,
  headerOverrides?: HeaderOverrides,
): Promise<HttpResponse> {
  const headers: Record<string, string> = {
    ...BASE_HEADERS,
    ...(headerOverrides ?? {}),
  };

  if (typeof body === "string" && !("Content-Type" in headers) && !("content-type" in headers)) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  if (process.env["OAUTH1_ENABLED"] === "true") {
    headers["Authorization"] = buildOAuthAuthorizationHeader(method, url, headers, body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "";

  return {
    status: response.status,
    data: parseResponseData(contentType, responseText),
    headers: toResponseHeaders(response.headers),
  };
}

function joinPaths(endpoint: string, resourcePath: string): string {
  return resourcePath ? endpoint.replace(/\/+$/, "") + "/" + resourcePath.replace(/^\/+/, "") : endpoint;
}

function getDocumentQuery(params: QueryParams): string {
  return `?${oldHelpers.getUrlEncoding(params)}`;
}

const requests = {
  resourcePaths: {
    activityProfile: PATH_ACTIVITIES_PROFILE,
    activityState: PATH_ACTIVITIES_STATE,
    agentsProfile: PATH_AGENTS_PROFILE,
  },

  async getStatementExact(id: string, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_STATEMENTS, { statementId: id }, headerOverrides);
  },

  async getStatementExactPromise(id: string, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_STATEMENTS, { statementId: id }, headerOverrides);
  },

  generateRandomMultipartBoundary(): string {
    return `-------------__${oldHelpers.generateUUID()}__123__456`;
  },

  async generateSignedStatementBody(statement: Record<string, JsonValue>, boundary?: string): Promise<string> {
    const multipartBoundary = boundary || requests.generateRandomMultipartBoundary();
    return (await oldHelpers.signStatement(statement, { boundary: multipartBoundary })).toString();
  },

  async sendSignedStatementBody(
    multipartBody: string,
    boundary: string,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_STATEMENTS);

    return sendRequest("POST", endpoint, multipartBody, {
      ...(headerOverrides ?? {}),
      "Content-Type": `multipart/mixed; boundary=${boundary}`,
    });
  },

  async sendStatement(statement: Record<string, JsonValue>, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_STATEMENTS);
    return sendRequest("POST", endpoint, JSON.stringify(statement), headerOverrides);
  },

  async sendStatementPromise(
    statement: Record<string, JsonValue>,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_STATEMENTS);
    return sendRequest("POST", endpoint, JSON.stringify(statement), headerOverrides);
  },

  async getActivityWithIRI(iri: string, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_ACTIVITIES);
    const query = `?activityId=${encodeURIComponent(iri)}`;

    return sendRequest("GET", endpoint + query, undefined, headerOverrides);
  },

  async putState(state: JsonValue, params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.putDocument(PATH_ACTIVITIES_STATE, state, params, headerOverrides);
  },

  async postState(state: JsonValue, params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.postDocument(PATH_ACTIVITIES_STATE, state, params, headerOverrides);
  },

  async deleteState(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.deleteDocument(PATH_ACTIVITIES_STATE, params, headerOverrides);
  },

  async getSingleState(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_ACTIVITIES_STATE, params, headerOverrides);
  },

  async getMultipleStates(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_ACTIVITIES_STATE, params, headerOverrides);
  },

  async putAgentProfile(
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    return requests.putDocument(PATH_AGENTS_PROFILE, document, params, headerOverrides);
  },

  async postAgentProfile(
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    return requests.postDocument(PATH_AGENTS_PROFILE, document, params, headerOverrides);
  },

  async deleteAgentProfile(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.deleteDocument(PATH_AGENTS_PROFILE, params, headerOverrides);
  },

  async getSingleAgentProfile(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_AGENTS_PROFILE, params, headerOverrides);
  },

  async getMultipleAgentProfiles(params: QueryParams, headerOverrides?: HeaderOverrides): Promise<HttpResponse> {
    return requests.getDocuments(PATH_AGENTS_PROFILE, params, headerOverrides);
  },

  async getDocuments(
    resourcePath: string,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, resourcePath);
    const query = getDocumentQuery(params);
    return sendRequest("GET", endpoint + query, undefined, headerOverrides);
  },

  async putDocument(
    resourcePath: string,
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, resourcePath);
    const query = getDocumentQuery(params);
    return sendRequest("PUT", endpoint + query, JSON.stringify(document), headerOverrides);
  },

  async postDocument(
    resourcePath: string,
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, resourcePath);
    const query = getDocumentQuery(params);
    return sendRequest("POST", endpoint + query, JSON.stringify(document), headerOverrides);
  },

  async postToStatements(
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_STATEMENTS);
    const query = getDocumentQuery(params);
    return sendRequest("POST", endpoint + query, JSON.stringify(document), headerOverrides);
  },

  async putToStatements(
    document: JsonValue,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, PATH_STATEMENTS);
    const query = getDocumentQuery(params);
    return sendRequest("PUT", endpoint + query, JSON.stringify(document), headerOverrides);
  },

  async deleteDocument(
    resourcePath: string,
    params: QueryParams,
    headerOverrides?: HeaderOverrides,
  ): Promise<HttpResponse> {
    const endpoint = joinPaths(LRS_ENDPOINT, resourcePath);
    const query = getDocumentQuery(params);
    return sendRequest("DELETE", endpoint + query, undefined, headerOverrides);
  },

  async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  },
};

export default requests;
