import { expect, test } from "bun:test";

import { runLrs } from "../src/run";

test("run command executes the copied upstream about-resource suite", async () => {
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
      file: ["test/v2_0/4.1.6.7-About-Resource.ts"],
      grep: "An LRS has an About Resource with endpoint",
      version: "2.0.0",
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test Suite Complete");
    expect(result.stdout).toContain('"total"');
  } finally {
    await server.stop(true);
  }
});
