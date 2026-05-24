import { expect, test } from "bun:test";
import { listTargetsStub } from "../src/list-targets-command";

test("listTargetsStub returns targets", () => {
  expect(listTargetsStub().length).toBeGreaterThan(0);
});
