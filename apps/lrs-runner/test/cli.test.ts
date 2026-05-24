import { expect, test } from "bun:test";

import { runLrs } from "../src/run";

test("scaffold run command checks about endpoint", async () => {
  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url);

      if (url.pathname === "/xapi/about") {
        return Response.json({ version: ["2.0.0"] });
      }

      return new Response("not found", { status: 404 });
    },
  });

  try {
    const result = await runLrs({
      baseUrl: `http://127.0.0.1:${server.port}/xapi`,
      version: "2.0.0",
    });

    expect(result.run.status).toBe("passed");
    expect(result.root.status).toBe("passed");
    expect(result.run.version).toBe("2.0.0");
    expect(result.run.events.length).toBeGreaterThan(0);
  } finally {
    await server.stop(true);
  }
});
