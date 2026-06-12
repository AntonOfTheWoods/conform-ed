import crypto from "node:crypto";
import childProcess from "child_process";
import { EventEmitter } from "events";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

type OAuthConfig = {
  auth_token_path: string;
  authorization_path: string;
  consumer_key?: string | undefined;
  consumer_secret?: string | undefined;
  endpoint?: string | undefined;
  request_token_path: string;
};

type OAuthToken = {
  token: string;
  token_secret: string;
  verifier: string;
};

type OAuthCallback = (error: unknown, token?: OAuthToken) => void;

type SpawnedHandle = {
  on(event: "error", listener: (error: Error) => void): void;
  unref(): void;
};

type SocketLike = {
  destroy(): void;
  on(event: "close", listener: () => void): void;
  setTimeout(timeoutMs: number): void;
};

type HttpServer = {
  close(callback?: () => void): void;
  on(event: "connection", listener: (socket: SocketLike) => void): void;
};

type AuthorizationLaunchCommand = {
  args: string[];
  command: string;
};

type OAuthTokenResponse = {
  oauth_token?: string;
  oauth_token_secret?: string;
  oauth_verifier?: string;
};

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, function (character) {
    return "%" + character.charCodeAt(0).toString(16).toUpperCase();
  });
}

function buildOAuthAuthorizationHeader(parameters: Record<string, string | undefined>): string {
  return (
    "OAuth " +
    Object.keys(parameters)
      .sort()
      .map(function (key) {
        return `${percentEncode(key)}="${percentEncode(parameters[key] ?? "")}"`;
      })
      .join(", ")
  );
}

function createPlaintextSignature(consumerSecret: string, tokenSecret?: string): string {
  return `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret ?? "")}`;
}

function createOAuthNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function createOAuthTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

async function postOAuthToken(url: string, authorizationHeader: string): Promise<OAuthTokenResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(responseBody || `OAuth request failed with status ${response.status}`);
  }

  return Object.fromEntries(new URLSearchParams(responseBody)) as OAuthTokenResponse;
}

export function resolveAuthorizationLaunchCommand(platform: string, url: string): AuthorizationLaunchCommand {
  if (platform === "darwin") {
    return {
      command: "open",
      args: [url],
    };
  }

  if (platform === "win32") {
    return {
      command: "cmd",
      args: ["/c", "start", "", url],
    };
  }

  return {
    command: "xdg-open",
    args: [url],
  };
}

export function openAuthorizationUrl(
  url: string,
  dependencies: {
    logger?: {
      log: (...args: unknown[]) => void;
    };
    platform?: string;
    spawn?: (command: string, args: string[], options: { detached: boolean; stdio: "ignore" }) => SpawnedHandle;
  } = {},
): void {
  const logger = dependencies.logger ?? console;
  const invocation = resolveAuthorizationLaunchCommand(dependencies.platform ?? process.platform, url);

  logger.log("Authorization URL", url);

  try {
    const handle = (dependencies.spawn ?? childProcess.spawn)(invocation.command, invocation.args, {
      detached: true,
      stdio: "ignore",
    });

    handle.on("error", function (error) {
      logger.log("Unable to open browser automatically", formatErrorMessage(error));
    });

    handle.unref();
  } catch (error) {
    logger.log("Unable to open browser automatically", formatErrorMessage(error));
  }
}

export function auth(config: OAuthConfig, callback: OAuthCallback): void {
  const app = new Hono();
  const authorizationEvents = new EventEmitter();
  const callbackUrl = "http://localhost:3000/authback";

  app.get("/authback", function (context) {
    const oauthVerifier = context.req.query("oauth_verifier");
    const oauthToken = context.req.query("oauth_token");

    setTimeout(function () {
      authorizationEvents.emit("authorized", oauthVerifier, oauthToken);
    }, 500);

    return context.text("OK - you can close this tab", 200);
  });

  const server: HttpServer = serve({
    fetch: app.fetch,
    port: 3000,
  });
  const sockets: Record<number, SocketLike> = {};
  let nextSocketId = 0;

  server.on("connection", function (socket) {
    const socketId = nextSocketId++;
    sockets[socketId] = socket;
    console.log("socket", socketId, "opened");

    socket.on("close", function () {
      console.log("socket", socketId, "closed");
      delete sockets[socketId];
    });

    socket.setTimeout(4000);
  });

  function killServer(): void {
    server.close(function () {
      console.log("Server closed!");
    });

    for (const socketId of Object.keys(sockets)) {
      console.log("socket", socketId, "destroyed");
      sockets[Number(socketId)]?.destroy();
    }
  }

  void (async function () {
    try {
      const requestTokenAuthorization = buildOAuthAuthorizationHeader({
        oauth_callback: callbackUrl,
        oauth_consumer_key: config.consumer_key ?? "",
        oauth_nonce: createOAuthNonce(),
        oauth_signature: createPlaintextSignature(config.consumer_secret ?? ""),
        oauth_signature_method: "PLAINTEXT",
        oauth_timestamp: createOAuthTimestamp(),
        oauth_version: "1.0",
      });

      const requestTokenResponse = await postOAuthToken(
        `${config.endpoint}${config.request_token_path}?scope=all`,
        requestTokenAuthorization,
      );

      const resolvedRequestToken = requestTokenResponse.oauth_token ?? "";
      const resolvedRequestTokenSecret = requestTokenResponse.oauth_token_secret ?? "";
      openAuthorizationUrl(`${config.endpoint}${config.authorization_path}?oauth_token=${resolvedRequestToken}`);

      authorizationEvents.on("authorized", function (verifier: string) {
        void (async function () {
          try {
            const accessTokenAuthorization = buildOAuthAuthorizationHeader({
              oauth_consumer_key: config.consumer_key ?? "",
              oauth_nonce: createOAuthNonce(),
              oauth_signature: createPlaintextSignature(config.consumer_secret ?? "", resolvedRequestTokenSecret),
              oauth_signature_method: "PLAINTEXT",
              oauth_timestamp: createOAuthTimestamp(),
              oauth_token: resolvedRequestToken,
              oauth_verifier: verifier,
              oauth_version: "1.0",
            });

            const accessTokenResponse = await postOAuthToken(
              `${config.endpoint}${config.auth_token_path}`,
              accessTokenAuthorization,
            );

            killServer();
            console.log("Request Token", resolvedRequestToken);
            console.log("Request Token Secret", resolvedRequestTokenSecret);
            console.log("Auth Token", accessTokenResponse.oauth_token);
            console.log("Auth Token Secret", accessTokenResponse.oauth_token_secret);
            console.log("Verifier", verifier);

            process.nextTick(function () {
              callback(null, {
                token: accessTokenResponse.oauth_token ?? "",
                token_secret: accessTokenResponse.oauth_token_secret ?? "",
                verifier,
              });
            });
          } catch (error) {
            killServer();
            callback(error);
          }
        })();
      });
    } catch (error) {
      killServer();
      callback(error);
    }
  })();
}

export const doOAuth1 = auth;
