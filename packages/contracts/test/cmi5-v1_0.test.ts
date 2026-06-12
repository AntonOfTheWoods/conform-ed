import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { XMLParser } from "fast-xml-parser";

import { Cmi5V1_0 } from "@conform-ed/contracts";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined ? [] : [value];
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/gu, " ").trim();
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function normalizeTextBlock(block: unknown): { langstrings: Array<{ lang?: string; value: string }> } {
  const record = (block ?? {}) as Record<string, unknown>;
  return {
    langstrings: asArray(
      record["langstring"] as Record<string, unknown> | Array<Record<string, unknown>> | undefined,
    ).map((langstring) => ({
      ...(typeof langstring["@_lang"] === "string" ? { lang: langstring["@_lang"] } : {}),
      value: normalizeText(typeof langstring["#text"] === "string" ? langstring["#text"] : undefined),
    })),
  };
}

function normalizeObjectives(value: unknown): Array<{ idref: string }> {
  const record = (value ?? {}) as Record<string, unknown>;
  return asArray(record["objective"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map(
    (objective) => ({
      idref: readString(objective, "@_idref") ?? "",
    }),
  );
}

function normalizeKeywordReferences(value: unknown): Array<{ idref: string }> {
  return asArray(value as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map((keyword) => ({
    idref: readString(keyword, "@_idref") ?? "",
  }));
}

function normalizeCourseItem(item: Record<string, unknown>): unknown {
  if (typeof item["url"] === "string") {
    return {
      id: readString(item, "@_id") ?? "",
      title: normalizeTextBlock(item["title"]),
      description: normalizeTextBlock(item["description"]),
      objectives: item["objectives"] ? normalizeObjectives(item["objectives"]) : undefined,
      url: item["url"],
      launchParameters: typeof item["launchParameters"] === "string" ? item["launchParameters"] : undefined,
      entitlementKey: typeof item["entitlementKey"] === "string" ? item["entitlementKey"] : undefined,
      moveOn: typeof item["@_moveOn"] === "string" ? item["@_moveOn"] : undefined,
      masteryScore: typeof item["@_masteryScore"] === "string" ? Number(item["@_masteryScore"]) : undefined,
      launchMethod: typeof item["@_launchMethod"] === "string" ? item["@_launchMethod"] : undefined,
      activityType: typeof item["@_activityType"] === "string" ? item["@_activityType"] : undefined,
      keywords: item["kw:keyword"] ? normalizeKeywordReferences(item["kw:keyword"]) : undefined,
    };
  }

  return {
    id: readString(item, "@_id") ?? "",
    title: normalizeTextBlock(item["title"]),
    description: normalizeTextBlock(item["description"]),
    objectives: item["objectives"] ? normalizeObjectives(item["objectives"]) : undefined,
    children: [
      ...asArray(item["au"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map((au) =>
        normalizeCourseItem(au),
      ),
      ...asArray(item["block"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map((block) =>
        normalizeCourseItem(block),
      ),
    ],
  };
}

function normalizeKeywordSet(value: unknown): {
  keywords: Array<{
    id: string;
    title: { langstrings: Array<{ lang?: string; value: string }> };
    description?: { langstrings: Array<{ lang?: string; value: string }> };
  }>;
} {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    keywords: asArray(record["kw:keyword"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map(
      (keyword) => ({
        id: readString(keyword, "@_id") ?? "",
        title: normalizeTextBlock(keyword["kw:title"]),
        ...(keyword["kw:description"] ? { description: normalizeTextBlock(keyword["kw:description"]) } : {}),
      }),
    ),
  };
}

function normalizeDocument(xml: string): unknown {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const root = (parsed["courseStructure"] ?? {}) as Record<string, unknown>;
  return {
    courseStructure: {
      course: {
        id: readString((root["course"] as Record<string, unknown>) ?? {}, "@_id") ?? "",
        title: normalizeTextBlock(((root["course"] as Record<string, unknown>) ?? {})["title"]),
        description: normalizeTextBlock(((root["course"] as Record<string, unknown>) ?? {})["description"]),
      },
      objectives: root["objectives"]
        ? asArray((root["objectives"] as Record<string, unknown>)["objective"]).map((objective) => ({
            id: readString(objective as Record<string, unknown>, "@_id") ?? "",
            title: normalizeTextBlock((objective as Record<string, unknown>)["title"]),
            description: normalizeTextBlock((objective as Record<string, unknown>)["description"]),
          }))
        : undefined,
      children: [
        ...asArray(root["au"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map((au) =>
          normalizeCourseItem(au),
        ),
        ...asArray(root["block"] as Array<Record<string, unknown>> | Record<string, unknown> | undefined).map((block) =>
          normalizeCourseItem(block),
        ),
      ],
    },
    keywords: root["kw:keywords"] ? normalizeKeywordSet(root["kw:keywords"]) : undefined,
  };
}

function readFixture(name: string): string {
  return readFileSync(resolve(import.meta.dir, "fixtures", "cmi5", name), "utf8");
}

test("cmi5 course structure schema parses the simple XML example", () => {
  const parsed = Cmi5V1_0.Schemas.CourseStructureDocument.safeParse(normalizeDocument(readFixture("simple-cmi5.xml")));
  expect(parsed.success).toBe(true);
});

test("cmi5 keyword extension schema parses the extended XML example", () => {
  const document = normalizeDocument(readFixture("extended-cmi5.xml")) as {
    keywords?: { keywords: Array<{ id: string }> };
  };

  expect(Cmi5V1_0.Schemas.CourseStructureDocument.safeParse(document).success).toBe(true);
  expect(Cmi5V1_0.Schemas.KeywordExtension.safeParse(document.keywords).success).toBe(true);
});

test("cmi5 recursive course structure schema accepts nested blocks and AUs", () => {
  const parsed = Cmi5V1_0.Schemas.CourseStructure.safeParse({
    course: {
      id: "http://course-repository.example.edu/identifiers/courses/02baafcf",
      title: { langstrings: [{ lang: "en-US", value: "Introduction to Geology" }] },
      description: { langstrings: [{ lang: "en-US", value: "Course overview" }] },
    },
    objectives: [
      {
        id: "http://objectives.example.com/identifiers/geology/basics",
        title: { langstrings: [{ lang: "en-US", value: "Geology - Basic knowledge" }] },
        description: { langstrings: [{ lang: "en-US", value: "Knowledge about basic terms" }] },
      },
    ],
    children: [
      {
        id: "http://courses.example.edu/identifiers/courses/d07e186b/blocks/001",
        title: { langstrings: [{ lang: "en-US", value: "Geologic materials" }] },
        description: { langstrings: [{ lang: "en-US", value: "Block description" }] },
        objectives: [{ idref: "http://objectives.example.com/identifiers/geology/basics" }],
        children: [
          {
            id: "http://courses.example.edu/identifiers/courses/d07e186b/blocks/001/aus/64f6",
            title: { langstrings: [{ lang: "en-US", value: "Rock and rock cycle" }] },
            description: { langstrings: [{ lang: "en-US", value: "AU description" }] },
            url: "http://courses.example.edu/identifiers/courses/d07e186b/blocks/001/aus/64f6/launch",
            moveOn: "CompletedOrPassed",
            masteryScore: 1,
            launchMethod: "AnyWindow",
            activityType: "http://adlnet.gov/expapi/activities/lesson",
          },
        ],
      },
    ],
  });

  expect(parsed.success).toBe(true);
});
