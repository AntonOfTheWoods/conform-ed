import requestFactoryImport from "../test/super-request.ts";
import type { OAuthOptions, RequestFactory as SuperRequestFactory } from "../test/super-request.ts";

type AnyRecord = Record<string, unknown>;
type HeaderMap = Record<string, string | undefined>;

type HelperState = {
  CAPTURE_OWNER_HEADER: string;
  DIRECTORY: string;
  LRS_ENDPOINT: string;
  TIME_MARGIN: number | undefined;
  URL_ABOUT: string;
  URL_ACTIVITIES: string;
  URL_ACTIVITIES_PROFILE: string;
  URL_ACTIVITIES_STATE: string;
  URL_AGENTS: string;
  URL_AGENTS_PROFILE: string;
  URL_STATEMENTS: string;
};

type RequestResponse = {
  body: unknown;
  headers: Record<string, string | undefined>;
  statusCode?: number;
  text?: string;
};

type RequestChain = {
  _options?: {
    oauth?: OAuthOptions;
  };
  body(payload: string | Buffer): RequestChain;
  end(callback: (error?: unknown, response?: RequestResponse) => void): RequestChain;
  expect(status: number): RequestChain;
  form(payload: Record<string, unknown>): RequestChain;
  headers(headers: HeaderMap): RequestChain;
  json(payload: unknown): RequestChain;
  method?: string;
  set(name: string, value: string): RequestChain;
  url?: string;
  wait(delay: Promise<unknown> | { then?: unknown }): RequestChain;
};

type RequestRoot = {
  get(url: string): RequestChain;
  post(url: string): RequestChain;
  put(url: string): RequestChain;
  del(url: string): RequestChain;
  delete(url: string): RequestChain;
  head(url: string): RequestChain;
};

type RequestFactory = (endpoint: string) => RequestRoot;

type HelperExports = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  addAllHeaders(header: HeaderMap, badAuth?: boolean): HeaderMap;
  addBasicAuthenicationHeader(header: HeaderMap): HeaderMap;
  addCaptureOwnerHeader(header: HeaderMap): HeaderMap;
  addHeaderXapiVersion(header: HeaderMap): HeaderMap;
  buildCaptureOwnerMetadata(): string | null;
  convertTemplate(list: Array<Record<string, unknown>>): Array<Record<string, unknown>>;
  createTestObject(list: Array<Record<string, unknown>>): AnyRecord;
  generateUUID(): string;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  getTimeMargin(): number | undefined;
  getUrlEncoding(object: Record<string, unknown>): string;
  getXapiVersion(): string | undefined;
};

export type HelperTransportContext = {
  extend(deep: boolean, target: AnyRecord, source: AnyRecord): AnyRecord;
  getHelperExports(): HelperExports;
  getState(): HelperState;
  setTimeMargin(value: number | undefined): void;
};

const runtimeGlobal = globalThis as typeof globalThis & {
  __lrsConformanceCaptureExecutionState?: {
    suitePath?: unknown;
    testTitle?: unknown;
  };
};

type OAuthSettings = {
  consumer_key: string;
  consumer_secret: string;
  token: string;
  token_secret: string;
  verifier: string;
};

type OAuthAdapter = {
  _buildAuthorizationHeaders(params: unknown): string;
  _prepareParameters(
    token: string,
    secret: string,
    method: unknown,
    url: unknown,
    additionalData: Record<string, unknown>,
  ): unknown;
};

function getOAuthSettings(): OAuthSettings | undefined {
  if (process.env["OAUTH1_ENABLED"] !== "true") {
    return undefined;
  }

  return {
    consumer_key: process.env["OAUTH1_CONSUMER_KEY"] ?? "",
    consumer_secret: process.env["OAUTH1_CONSUMER_SECRET"] ?? "",
    token: process.env["OAUTH1_TOKEN"] ?? "",
    token_secret: process.env["OAUTH1_TOKEN_SECRET"] ?? "",
    verifier: process.env["OAUTH1_VERIFIER"] ?? "",
  };
}

function cloneHeader(context: HelperTransportContext, header?: HeaderMap): HeaderMap {
  return context.extend(true, {}, header || {}) as HeaderMap;
}

function createHelperTransportSupport(context: HelperTransportContext) {
  const helper = function () {
    return context.getHelperExports();
  };

  return {
    addAllHeaders: function addAllHeaders(header: HeaderMap = {}, badAuth?: boolean) {
      badAuth = badAuth || false;
      let newHeader = cloneHeader(context, header);
      newHeader = helper().addHeaderXapiVersion(newHeader);
      if (badAuth) {
        newHeader["Authorization"] = "Basic " + Buffer.from("foo:bar").toString("base64");
      } else {
        newHeader = helper().addBasicAuthenicationHeader(newHeader);
      }
      newHeader = helper().addCaptureOwnerHeader(newHeader);
      return newHeader;
    },

    addHeaderXapiVersion: function addHeaderXapiVersion(header: HeaderMap = {}) {
      const newHeader = cloneHeader(context, header);
      newHeader["X-Experience-API-Version"] = helper().getXapiVersion();
      return newHeader;
    },

    addBasicAuthenicationHeader: function addBasicAuthenicationHeader(header: HeaderMap = {}) {
      const newHeader = cloneHeader(context, header);
      if (process.env["BASIC_AUTH_ENABLED"] === "true") {
        const userPass = Buffer.from(
          process.env["BASIC_AUTH_USER"] + ":" + process.env["BASIC_AUTH_PASSWORD"],
        ).toString("base64");
        newHeader["Authorization"] = "Basic " + userPass;
      }
      return newHeader;
    },

    buildCaptureOwnerMetadata: function buildCaptureOwnerMetadata() {
      const state = context.getState();
      const executionState = runtimeGlobal.__lrsConformanceCaptureExecutionState;
      if (!executionState || !Array.isArray(executionState.suitePath)) {
        return null;
      }

      const suitePath = executionState.suitePath.filter(function (segment: unknown) {
        return typeof segment === "string" && segment.length > 0;
      });
      const testTitle =
        typeof executionState.testTitle === "string" && executionState.testTitle.length > 0
          ? executionState.testTitle
          : null;
      if (suitePath.length === 0 && !testTitle) {
        return null;
      }

      const casePath = testTitle ? suitePath.concat([testTitle]) : null;
      const ownerPath = casePath || suitePath;
      const fallbackSuiteTitle = suitePath.length > 0 ? suitePath[0] : "unmapped";
      const sourceFilePath = process.env["LRS_CAPTURE_SOURCE_FILE_PATH"] || null;
      const sourceSymbol = process.env["LRS_CAPTURE_SOURCE_SYMBOL"] || null;

      return encodeURIComponent(
        JSON.stringify({
          casePath: casePath,
          directory: process.env["LRS_CAPTURE_DIRECTORY"] || state.DIRECTORY || "",
          hookTitle: null,
          ownerLabel: ownerPath.join(" > "),
          phase: testTitle ? "case" : "before",
          sourceFilePath: sourceFilePath,
          sourceSymbol: sourceSymbol,
          suitePath: suitePath,
          unitKey:
            process.env["LRS_CAPTURE_UNIT_KEY"] ||
            (process.env["LRS_CAPTURE_DIRECTORY"] || state.DIRECTORY || "unmapped") + ":" + fallbackSuiteTitle,
          version: process.env["LRS_CAPTURE_VERSION"] || process.env["XAPI_VERSION"] || "",
        }),
      );
    },

    addCaptureOwnerHeader: function addCaptureOwnerHeader(header: HeaderMap = {}) {
      const newHeader = cloneHeader(context, header);
      const metadata = helper().buildCaptureOwnerMetadata();
      if (metadata) {
        newHeader[context.getState().CAPTURE_OWNER_HEADER] = metadata;
      }
      return newHeader;
    },

    genDelay: function genDelay(time: number, query?: string, id?: string) {
      let requestFactory: RequestFactory = requestFactoryImport as unknown as RequestFactory;

      const delay = function () {
        let resolved = false;
        let resolvePromise: () => void = function () {};
        let rejectPromise: (error: unknown) => void = function () {};
        const p = new Promise<void>(function (resolve, reject) {
          resolvePromise = resolve;
          rejectPromise = reject;
        });
        let endP = helper().getEndpointStatements();
        if (query) {
          endP += query;
        }
        let delta: number | undefined;
        let finish: number | undefined;

        function stmtFound(arr: Array<{ id?: string }>, expectedId: string) {
          let found = false;
          arr.forEach(function (statement) {
            if (statement.id === expectedId) {
              found = true;
            }
          });
          return found;
        }

        function doRequest() {
          if (getOAuthSettings()) {
            requestFactory = helper().OAuthRequest(requestFactory);
          }
          requestFactory(helper().getEndpointAndAuth())
            .get(endP)
            .headers(helper().addAllHeaders({}))
            .end(function (err?: unknown, res?: RequestResponse) {
              let result: AnyRecord;
              if (err) {
                rejectPromise(err);
                return;
              }

              if (!res) {
                rejectPromise(new Error("Missing response object in consistency callback."));
                return;
              }

              const consistentThroughHeader = res.headers["x-experience-api-consistent-through"];
              const dateHeader = res.headers["date"];

              if (typeof res.body === "string") {
                try {
                  result = JSON.parse(res.body);
                } catch {
                  result = {};
                }
              } else if (res.body && typeof res.body === "object") {
                result = res.body as AnyRecord;
              } else {
                result = {};
              }

              function resolveOnce() {
                if (resolved) {
                  return;
                }
                resolved = true;
                resolvePromise();
              }

              if (id && result["id"] && result["id"] === id) {
                resolveOnce();
              } else if (id && Array.isArray(result["statements"]) && stmtFound(result["statements"], id)) {
                resolveOnce();
              } else if (
                new Date(consistentThroughHeader ?? Number.NaN).valueOf() + (helper().getTimeMargin() ?? Number.NaN) >=
                time
              ) {
                resolveOnce();
              } else {
                if (!delta) {
                  delta =
                    new Date(dateHeader ?? Number.NaN).valueOf() -
                    new Date(consistentThroughHeader ?? Number.NaN).valueOf();
                  finish = Date.now() + 10 * Math.abs(delta);

                  if (isNaN(finish)) {
                    rejectPromise(
                      new TypeError("X-Experience-API-Consistent-Through header was missing or not a number."),
                    );
                    return;
                  }
                }

                if (typeof finish === "number" && Date.now() >= finish) {
                  resolveOnce();
                } else {
                  setTimeout(doRequest, 1000);
                }
              }
            });
        }

        doRequest();
        return p;
      };

      return delay();
    },

    getEndpoint: function getEndpoint() {
      return context.getState().LRS_ENDPOINT;
    },

    getEndpointAndAuth: function getEndpointAndAuth() {
      return context.getState().LRS_ENDPOINT;
    },

    getEndpointAbout: function getEndpointAbout() {
      return context.getState().URL_ABOUT;
    },

    getEndpointActivities: function getEndpointActivities() {
      return context.getState().URL_ACTIVITIES;
    },

    getEndpointActivitiesProfile: function getEndpointActivitiesProfile() {
      return context.getState().URL_ACTIVITIES_PROFILE;
    },

    getEndpointActivitiesState: function getEndpointActivitiesState() {
      return context.getState().URL_ACTIVITIES_STATE;
    },

    getEndpointAgents: function getEndpointAgents() {
      return context.getState().URL_AGENTS;
    },

    getEndpointAgentsProfile: function getEndpointAgentsProfile() {
      return context.getState().URL_AGENTS_PROFILE;
    },

    getEndpointStatements: function getEndpointStatements() {
      return context.getState().URL_STATEMENTS;
    },

    getTimeMargin: function getTimeMargin() {
      return context.getState().TIME_MARGIN ?? 0;
    },

    sendRequest: function sendRequest(
      type: string,
      url: string,
      params: Record<string, unknown> | undefined,
      body: Buffer | Record<string, unknown> | unknown[] | string | undefined,
      expectedStatus: number,
      extraHeaders?: HeaderMap,
    ) {
      let requestFactory: RequestFactory = requestFactoryImport as unknown as RequestFactory;
      const methodName = type === "delete" ? "del" : type;
      if (getOAuthSettings()) {
        requestFactory = helper().OAuthRequest(requestFactory);
      }

      const requestRoot = requestFactory(helper().getEndpointAndAuth());
      const reqUrl = params ? url + "?" + helper().getUrlEncoding(params) : url;

      const headers = helper().addAllHeaders(extraHeaders || {});
      const requestMethod = requestRoot[methodName as keyof RequestRoot] as
        | ((requestUrl: string) => RequestChain)
        | undefined;
      if (typeof requestMethod !== "function") {
        throw new TypeError("Unsupported request method: " + methodName);
      }
      const pre = requestMethod.call(requestRoot, reqUrl);
      if (body) {
        if (Buffer.isBuffer(body) || typeof body === "string") {
          if (!headers["content-type"] && !headers["Content-Type"]) {
            headers["content-type"] = "application/x-www-form-urlencoded";
          }
          pre.body(body);
        } else {
          pre.json(body);
        }
      }
      pre.headers(headers);

      return new Promise<RequestResponse>(function (resolve, reject) {
        pre.expect(expectedStatus).end(function (error?: unknown, response?: RequestResponse) {
          if (error) {
            reject(error);
            return;
          }

          if (!response) {
            reject(new Error("Missing response object in request callback."));
            return;
          }

          const contentType = response && response.headers ? response.headers["content-type"] : undefined;
          if (response && typeof response.body === "string" && contentType && contentType.includes("json")) {
            try {
              response.body = JSON.parse(response.body);
            } catch {}
          }

          if (response && typeof response.text === "undefined" && typeof response.body === "string") {
            response.text = response.body;
          }

          resolve(response);
        });
      });
    },

    extendRequestWithOauth: function extendRequestWithOauth(pre: RequestChain) {
      const preWithSign = pre as AnyRecord;
      preWithSign["sign"] = function (oa: OAuthAdapter, token: string, secret: string) {
        let additionalData: AnyRecord = {};
        additionalData = JSON.parse(JSON.stringify(additionalData));
        additionalData["oauth_verifier"] = getOAuthSettings()?.verifier;
        const params = oa["_prepareParameters"](token, secret, pre.method, pre.url, additionalData);

        const signature = oa["_buildAuthorizationHeaders"](params);
        pre.set("Authorization", signature);
      };
    },

    setTimeMargin: function setTimeMargin(done: (error?: unknown, ...ignored: unknown[]) => void) {
      let requestFactory = requestFactoryImport as unknown as RequestFactory;
      const temp: Array<Record<string, string>> = [{ statement: "{{statements.default}}" }];
      const id = helper().generateUUID();
      const query = helper().getUrlEncoding({
        statementId: id,
      });
      let lrsTime: Date;
      let suiteTime: Date;
      const statementContainer = helper().createTestObject(helper().convertTemplate(temp)) as {
        statement: AnyRecord;
      };
      const stmt = statementContainer.statement;

      stmt["id"] = id;
      suiteTime = new Date();

      if (getOAuthSettings()) {
        requestFactory = helper().OAuthRequest(requestFactory);
      }

      requestFactory(helper().getEndpointAndAuth())
        .post(helper().getEndpointStatements())
        .headers(helper().addAllHeaders({}))
        .json(stmt)
        .expect(200)
        .end(function (err?: unknown, _res?: RequestResponse) {
          if (err) {
            done(err);
          } else {
            function redo() {
              requestFactory(helper().getEndpointAndAuth())
                .get(helper().getEndpointStatements() + "?" + query)
                .headers(helper().addAllHeaders({}))
                .end(function (redoErr?: unknown, redoRes?: RequestResponse) {
                  if (redoErr) {
                    done(redoErr);
                  } else if (!redoRes) {
                    done(new Error("Missing response object in retry callback."));
                  } else if (redoRes.statusCode === 200) {
                    const result =
                      typeof redoRes.body === "string"
                        ? (JSON.parse(redoRes.body) as { stored: string })
                        : (redoRes.body as { stored: string });
                    lrsTime = new Date(result.stored);
                    context.setTimeMargin(suiteTime.valueOf() - lrsTime.valueOf());
                    done(redoErr, helper().getTimeMargin());
                  } else {
                    setTimeout(redo, 2000);
                  }
                });
            }

            redo();
          }
        });
    },

    getUrlEncoding: function getUrlEncoding(object: Record<string, unknown>) {
      let encoding = "";
      Object.keys(object).forEach(function (key, index) {
        if (index !== 0) {
          encoding += "&";
        }
        const value = object[key];
        // eslint-disable-next-line typescript/no-base-to-string
        encoding += key + "=" + (typeof value === "object" ? encodeURIComponent(JSON.stringify(value)) : value);
      });
      return encoding;
    },

    getXapiVersion: function getXapiVersion() {
      return process.env["XAPI_VERSION"];
    },

    OAuthRequest: function OAuthRequest(request: RequestFactory) {
      const originalRequest = request;

      function authRequest(e: string) {
        const r = originalRequest(e);

        function wrapPromise(p: AnyRecord | undefined) {
          if (!p) return;
          if (p["__wrapped"]) return;
          p["__wrapped"] = true;
          for (const i in p) {
            (function (methodName) {
              if (typeof p[methodName] !== "function") return;
              const preAuthMethod = p[methodName] as (...args: unknown[]) => unknown;
              p[methodName + "_preAuth_"] = preAuthMethod;
              p[methodName] = function () {
                const test = preAuthMethod.apply(p, arguments as unknown as []);
                if (test) {
                  if (methodName === "end") {
                    wrapPromise(test as AnyRecord | undefined);
                  } else {
                    wrapMethods(test as AnyRecord | undefined);
                  }
                }
                return test;
              };
            })(i);
          }
        }

        function wrapMethods(testRequest: AnyRecord | undefined) {
          if (!testRequest) return;
          if (testRequest["__wrapped"]) return;
          testRequest["__wrapped"] = true;
          const oauthSettings = getOAuthSettings();
          const requestOptions = testRequest["_options"] as { oauth?: OAuthOptions } | undefined;
          if (requestOptions) requestOptions.oauth = oauthSettings;
          for (const i in testRequest) {
            (function (methodName) {
              if (typeof testRequest[methodName] !== "function") return;
              const preAuthMethod = testRequest[methodName] as (...args: unknown[]) => unknown;
              testRequest["_preAuth_" + methodName] = preAuthMethod;
              testRequest[methodName] = function () {
                const nextTest = preAuthMethod.apply(testRequest, arguments as unknown as []);
                const wrappedNextTest = nextTest as AnyRecord | undefined;
                const wrappedOptions = wrappedNextTest?.["_options"] as { oauth?: OAuthOptions } | undefined;
                if (wrappedNextTest && wrappedOptions && !wrappedOptions.oauth) {
                  wrappedOptions.oauth = getOAuthSettings();
                  wrapMethods(wrappedNextTest);
                  return wrappedNextTest;
                }
                if (methodName === "end") {
                  wrapPromise(wrappedNextTest);
                }

                return nextTest;
              };
            })(i);
          }
        }

        wrapMethods(r);
        return r;
      }

      return authRequest as SuperRequestFactory as RequestFactory;
    },
  };
}

export { createHelperTransportSupport };
export type HelperTransportSupport = ReturnType<typeof createHelperTransportSupport>;

export default {
  createHelperTransportSupport,
};
