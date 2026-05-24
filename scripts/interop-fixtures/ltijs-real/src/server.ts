const ltiModule = await import("ltijs");

interface LtijsProvider {
  app: {
    get: (
      path: string,
      handler: (_req: unknown, res: { status: (code: number) => { send: (body: string) => void } }) => void,
    ) => void;
  };
  setup: (
    key: string,
    database: { url: string },
    options: { devMode: boolean; loginRoute: string; keysetRoute: string },
  ) => Promise<void>;
  onConnect: (
    handler: (
      _token: unknown,
      _req: unknown,
      res: { status: (code: number) => { send: (body: string) => void } },
    ) => void,
  ) => void;
  deploy: (options: { port: number }) => Promise<void>;
}

const LTI = (ltiModule as { Provider: LtijsProvider }).Provider;

const port = Number.parseInt(process.env.PORT ?? "15610", 10);
const mongoUrl = process.env.MONGODB_URI?.trim() || "mongodb://mongo:27017/ltijs";
const ltiKey = process.env.LTIJS_KEY?.trim() || "conform-ed-ltijs-key";

await LTI.setup(
  ltiKey,
  { url: mongoUrl },
  {
    devMode: true,
    loginRoute: "/login",
    keysetRoute: "/keys",
  },
);

LTI.app.get("/health", (_req: unknown, res: { status: (code: number) => { send: (body: string) => void } }) => {
  res.status(200).send("ok");
});

LTI.onConnect((_token: unknown, _req: unknown, res: { status: (code: number) => { send: (body: string) => void } }) => {
  res.status(200).send("ltijs-tool-ready");
});

await LTI.deploy({ port });

console.log(`[ltijs-real] listening on ${port}`);
