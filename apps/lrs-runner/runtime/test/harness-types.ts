import type helperImport from "./helper.ts";
import type { RequestFactory, RequestResponse } from "./super-request.ts";

export type RuntimeHelper = typeof helperImport;
export type RuntimeRequestFactory = RequestFactory;
export type RuntimeRequestResponse = RequestResponse;
export type RuntimeTemplatingSelection = {
  createTemplate(name: string): void;
};
