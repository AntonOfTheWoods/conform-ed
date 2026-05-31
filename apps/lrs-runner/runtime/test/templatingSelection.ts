import { describe, it } from "./bun-test.ts";

type TemplateMapping = Record<string, string>;

type TemplateTest = {
  name: string;
  expect: unknown[];
  json?: unknown;
  templates?: TemplateMapping[];
};

type TemplateConfiguration = {
  name: string;
  config: TemplateTest[];
};

type TemplateHelper = {
  OAuthRequest(request: RequestFactory): RequestFactory;
  getSingleTestConfiguration(templateName: string): TemplateConfiguration[];
  convertTemplate(templates: TemplateMapping[]): unknown;
  createTestObject(converted: unknown): Record<string, unknown>;
  getEndpointAndAuth(): string;
  getEndpointStatements(): string;
  addAllHeaders(headers: Record<string, string>): Record<string, string>;
};

import helperImport from "./helper.ts";
import requestModule, { endAsync, type RequestChain, type RequestFactory } from "./super-request.ts";

const helper = helperImport as TemplateHelper;

const activeRequest: RequestFactory =
  process.env["OAUTH1_ENABLED"] === "true" ? helper.OAuthRequest(requestModule) : requestModule;

export function createTemplate(templateName: string): void {
  const configurations = helper.getSingleTestConfiguration(templateName);

  configurations.forEach((configuration) => {
    describe(configuration.name, () => {
      configuration.config.forEach((templateTest) => {
        it(templateTest.name, async () => {
          if (!templateTest.templates && !templateTest.json) {
            throw new Error(`Invalid test: "${templateTest.name}"`);
          }

          try {
            let data: unknown = {};

            if (templateTest.templates) {
              const converted = helper.convertTemplate(templateTest.templates);
              const mockObject = helper.createTestObject(converted);
              const key = Object.keys(mockObject)[0];
              if (typeof key !== "undefined") {
                data = mockObject[key];
              }
            } else {
              data = templateTest.json;
            }

            const promise = activeRequest(helper.getEndpointAndAuth())
              .post(helper.getEndpointStatements())
              .headers(helper.addAllHeaders({}))
              .json(data);

            const request = (promise.expect as (...args: unknown[]) => RequestChain)(...templateTest.expect);
            await endAsync(request);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Invalid test: "${templateTest.name}" with error: ${message}`);
          }
        });
      });
    });
  });
}

export default {
  createTemplate,
};
