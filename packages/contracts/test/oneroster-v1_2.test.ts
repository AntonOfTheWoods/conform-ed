import { expect, test } from "bun:test";

import { OneRosterV1_2 } from "../src";

test("UserSchema parses a minimal OneRoster user", () => {
  const parsed = OneRosterV1_2.UserSchema.safeParse({
    sourcedId: "user-1",
    status: "active",
    dateLastModified: "2025-01-01T00:00:00Z",
    enabledUser: "true",
    givenName: "Ada",
    familyName: "Lovelace",
    roles: [
      {
        roleType: "primary",
        role: "teacher",
        org: {
          href: "https://example.edu/orgs/1",
          sourcedId: "org-1",
          type: "org",
        },
      },
    ],
  });

  expect(parsed.success).toBe(true);
});

test("LineItemSchema parses a minimal gradebook line item", () => {
  const parsed = OneRosterV1_2.LineItemSchema.safeParse({
    sourcedId: "line-item-1",
    status: "active",
    dateLastModified: "2025-01-01T00:00:00Z",
    title: "Quiz 1",
    assignDate: "2025-01-10T09:00:00Z",
    dueDate: "2025-01-17T09:00:00Z",
    class: {
      href: "https://example.edu/classes/1",
      sourcedId: "class-1",
      type: "class",
    },
    school: {
      href: "https://example.edu/orgs/1",
      sourcedId: "org-1",
      type: "org",
    },
    category: {
      href: "https://example.edu/categories/1",
      sourcedId: "category-1",
      type: "category",
    },
  });

  expect(parsed.success).toBe(true);
});

test("ResourceSchema parses a minimal resource entry", () => {
  const parsed = OneRosterV1_2.ResourceSchema.safeParse({
    sourcedId: "resource-1",
    status: "active",
    dateLastModified: "2025-01-01T00:00:00Z",
    vendorResourceId: "vendor-asset-991",
    importance: "primary",
    roles: ["student", "teacher"],
  });

  expect(parsed.success).toBe(true);
});

test("ImsxStatusInfoSchema parses a OneRoster status envelope", () => {
  const parsed = OneRosterV1_2.ImsxStatusInfoSchema.safeParse({
    imsx_codeMajor: "failure",
    imsx_severity: "error",
    imsx_description: "Unknown object",
    imsx_CodeMinor: {
      imsx_codeMinorField: [
        {
          imsx_codeMinorFieldName: "sourcedId",
          imsx_codeMinorFieldValue: "unknownobject",
        },
      ],
    },
  });

  expect(parsed.success).toBe(true);
});

test("EnrollmentRoleSchema accepts extension values and rejects unknown built-ins", () => {
  expect(OneRosterV1_2.EnrollmentRoleSchema.safeParse("ext:mentor").success).toBe(true);
  expect(OneRosterV1_2.EnrollmentRoleSchema.safeParse("mentor").success).toBe(false);
});

test("ClassSchema requires at least one term reference", () => {
  const parsed = OneRosterV1_2.ClassSchema.safeParse({
    sourcedId: "class-1",
    status: "active",
    dateLastModified: "2025-01-01T00:00:00Z",
    title: "Algebra I",
    course: {
      href: "https://example.edu/courses/1",
      sourcedId: "course-1",
      type: "course",
    },
    school: {
      href: "https://example.edu/orgs/1",
      sourcedId: "org-1",
      type: "org",
    },
    terms: [],
  });

  expect(parsed.success).toBe(false);
});

test("OneRoster12DerivedZodTemplates exposes core published entry points", () => {
  expect(OneRosterV1_2.OneRoster12DerivedZodTemplates.user).toBe(OneRosterV1_2.UserSchema);
  expect(OneRosterV1_2.OneRoster12DerivedZodTemplates.lineItem).toBe(OneRosterV1_2.LineItemSchema);
  expect(OneRosterV1_2.OneRoster12DerivedZodTemplates.resource).toBe(OneRosterV1_2.ResourceSchema);
  expect(OneRosterV1_2.OneRoster12DerivedZodTemplates.imsxStatusInfo).toBe(OneRosterV1_2.ImsxStatusInfoSchema);
});

test("OneRoster REST binding operation catalogs expose all endpoint schemas", () => {
  expect(Object.keys(OneRosterV1_2.RosteringRestBindingOperationSchemas).length).toBe(41);
  expect(Object.keys(OneRosterV1_2.GradebookRestBindingOperationSchemas).length).toBe(35);
  expect(Object.keys(OneRosterV1_2.ResourceRestBindingOperationSchemas).length).toBe(5);
});

test("Gradebook operation bindings expose request/response payload schemas", () => {
  const binding = OneRosterV1_2.GradebookRestBindingOperationSchemas.postLineItemsForClass;

  expect(binding.method).toBe("POST");
  expect(binding.path).toBe("/classes/{classSourcedId}/lineItems");
  expect(binding.requestPayload).toBe(OneRosterV1_2.LineItemSetSchema);
  expect(binding.successResponsePayload).toBe(OneRosterV1_2.GuidPairSetSchema);
  expect(binding.errorResponsePayload).toBe(OneRosterV1_2.ImsxStatusInfoSchema);
});

test("ManifestCsvRowSchema accepts either starred or unstarred optional file keys", () => {
  const parsed = OneRosterV1_2.ManifestCsvRowSchema.safeParse({
    "manifest.version": "1.0",
    "oneroster.version": "1.2",
    "file.academicSessions": "bulk",
    "file.categories": "bulk",
    "file.classes": "bulk",
    "file.classResources": "bulk",
    "file.courses": "bulk",
    "file.courseResources": "bulk",
    "file.demographics": "bulk",
    "file.enrollments": "bulk",
    "file.lineItems": "bulk",
    "file.orgs": "bulk",
    "file.resources": "bulk",
    "file.results": "bulk",
    "file.users": "bulk",
    "file.lineItemLearningObjectiveIds*": "bulk",
    "file.lineItemScoreScales": "bulk",
    "file.resultLearningObjectiveIds*": "bulk",
    "file.resultScoreScales": "bulk",
    "file.roles*": "bulk",
    "file.scoreScales": "bulk",
    "file.userProfiles*": "bulk",
    "file.userResources": "bulk",
  });

  expect(parsed.success).toBe(true);
});

test("UsersCsvRowSchema validates required OneRoster 1.2 user CSV columns", () => {
  const parsed = OneRosterV1_2.UsersCsvRowSchema.safeParse({
    sourcedId: "user-1",
    status: "active",
    dateLastModified: "2025-01-01T00:00:00Z",
    enabledUser: "true",
    username: "ada",
    givenName: "Ada",
    familyName: "Lovelace",
  });

  expect(parsed.success).toBe(true);
});

test("OneRosterCsvBindingPackageSchema validates package-level CSV document sets", () => {
  const parsed = OneRosterV1_2.OneRosterCsvBindingPackageSchema.safeParse({
    manifest: [
      {
        "manifest.version": "1.0",
        "oneroster.version": "1.2",
        "file.academicSessions": "bulk",
        "file.categories": "bulk",
        "file.classes": "bulk",
        "file.classResources": "bulk",
        "file.courses": "bulk",
        "file.courseResources": "bulk",
        "file.demographics": "bulk",
        "file.enrollments": "bulk",
        "file.lineItems": "bulk",
        "file.orgs": "bulk",
        "file.resources": "bulk",
        "file.results": "bulk",
        "file.users": "bulk",
        "file.lineItemLearningObjectiveIds": "bulk",
        "file.lineItemScoreScales": "bulk",
        "file.resultLearningObjectiveIds": "bulk",
        "file.resultScoreScales": "bulk",
        "file.roles": "bulk",
        "file.scoreScales": "bulk",
        "file.userProfiles": "bulk",
        "file.userResources": "bulk",
      },
    ],
    users: [
      {
        sourcedId: "user-1",
        status: "active",
        dateLastModified: "2025-01-01T00:00:00Z",
        enabledUser: "true",
        username: "ada",
        givenName: "Ada",
        familyName: "Lovelace",
      },
    ],
    orgs: [
      {
        sourcedId: "org-1",
        status: "active",
        dateLastModified: "2025-01-01T00:00:00Z",
        name: "Example School",
        type: "school",
      },
    ],
  });

  expect(parsed.success).toBe(true);
});
