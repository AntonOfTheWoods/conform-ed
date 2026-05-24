import { z } from "zod";

import { CurriculumStandardsMetadataSetSchema } from "../shared/ccv1p4_imscsmd_v1p1";
import { CommonCartridgeAuthorizationsSchema } from "../shared/ccv1p4_imsccauth_v1p4";
import { LomManifestSchema } from "./ccv1p4_lommanifest_v1p0";
import { LomResourceSchema } from "./ccv1p4_lomresource_v1p0";
import {
  NonEmptyStringSchema,
  UriReferenceSchema,
  XmlExtensionNodeListSchema,
  addIssue,
  asArray,
  collectDuplicates,
  strictObject,
} from "../shared";

export const CommonCartridgeResourceTypeSchema = z.enum([
  "webcontent",
  "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
  "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
  "associatedcontent/imscc_xmlv1p4/learning-application-resource",
  "imsdt_xmlv1p4",
  "imswl_xmlv1p4",
  "imsbasiclti_xmlv1p4",
  "idpfepub_epubv3p0",
  "imsapip_zipv1p0",
  "imsiwb_iwbv1p0",
  "assignment_xmlv1p0",
  "imsov_xmlv1p0",
  "imsov_zipv1p0",
  "imsqti_zipv3p0",
]);

export const CommonCartridgeIntendedUseSchema = z.enum(["assignment", "lessonplan", "syllabus", "unspecified"]);

export const CommonCartridgeGenericMetadataSchema = strictObject({
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const CommonCartridgeDependencySchema = strictObject({
  identifierref: NonEmptyStringSchema,
});

export const CommonCartridgeFileSchema = strictObject({
  href: UriReferenceSchema,
  metadata: CommonCartridgeGenericMetadataSchema.optional(),
});

export const CommonCartridgeItemSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    identifier: NonEmptyStringSchema,
    identifierref: NonEmptyStringSchema.optional(),
    title: z.string(),
    item: z.array(CommonCartridgeItemSchema).optional(),
    metadata: CommonCartridgeGenericMetadataSchema.optional(),
  }),
);

export const CommonCartridgeItemOrgSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    identifier: NonEmptyStringSchema,
    item: z.array(CommonCartridgeItemSchema).optional(),
    metadata: CommonCartridgeGenericMetadataSchema.optional(),
  }),
);

export const CommonCartridgeOrganizationSchema = strictObject({
  identifier: NonEmptyStringSchema,
  structure: z.literal("rooted-hierarchy"),
  title: z.string().optional(),
  item: CommonCartridgeItemOrgSchema,
  metadata: CommonCartridgeGenericMetadataSchema.optional(),
});

export const CommonCartridgeOrganizationsSchema = strictObject({
  organization: CommonCartridgeOrganizationSchema.optional(),
});

export const CommonCartridgeManifestMetadataSchema = strictObject({
  schema: z.enum([
    "IMS Common Cartridge",
    "IMS K-12 Common Cartridge",
    "IMS Thin Common Cartridge",
    "IMS K-12 Thin Common Cartridge",
  ]),
  schemaversion: z.literal("1.4.0"),
  lom: LomManifestSchema,
  curriculumStandardsMetadataSet: CurriculumStandardsMetadataSetSchema.optional(),
});

export const CommonCartridgeResourceMetadataSchema = strictObject({
  schema: z.string().optional(),
  schemaversion: z.string().optional(),
  lom: LomResourceSchema.optional(),
  curriculumStandardsMetadataSet: z.array(CurriculumStandardsMetadataSetSchema).optional(),
});

export const CommonCartridgeResourceSchema = strictObject({
  identifier: NonEmptyStringSchema,
  type: CommonCartridgeResourceTypeSchema,
  href: UriReferenceSchema.optional(),
  xmlBase: z.string().optional(),
  intendeduse: CommonCartridgeIntendedUseSchema.optional(),
  // `protected` is imported from `imsccauth` as a global `xs:boolean` attribute. The manifest
  // profile applies a schema-level default of `false`, but parsed XML objects do not reliably
  // materialize XSD defaults, so the normalized JS model keeps it optional.
  protected: z.boolean().optional(),
  metadata: CommonCartridgeResourceMetadataSchema.optional(),
  file: z.array(CommonCartridgeFileSchema).optional(),
  dependency: z.array(CommonCartridgeDependencySchema).optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const CommonCartridgeResourcesSchema = strictObject({
  xmlBase: z.string().optional(),
  resource: z.array(CommonCartridgeResourceSchema).optional(),
});

export const CommonCartridgeManifestRawSchema = strictObject({
  identifier: NonEmptyStringSchema,
  xmlBase: z.string().optional(),
  metadata: CommonCartridgeManifestMetadataSchema,
  organizations: CommonCartridgeOrganizationsSchema,
  resources: CommonCartridgeResourcesSchema,
  authorizations: CommonCartridgeAuthorizationsSchema.optional(),
});

type CommonCartridgeTraversalItem = {
  identifier: string;
  identifierref?: string;
  item?: CommonCartridgeTraversalItem[];
};

type CommonCartridgeTraversalManifest = {
  organizations: {
    organization?: {
      item: {
        item?: CommonCartridgeTraversalItem[];
      };
    };
  };
};

function walkCommonCartridgeItems(
  item: CommonCartridgeTraversalItem,
  visit: (candidate: CommonCartridgeTraversalItem) => void,
) {
  visit(item);
  for (const child of asArray(item.item)) {
    walkCommonCartridgeItems(child, visit);
  }
}

function collectCommonCartridgeItems(manifest: CommonCartridgeTraversalManifest): CommonCartridgeTraversalItem[] {
  const items: CommonCartridgeTraversalItem[] = [];
  const rootItem = manifest.organizations.organization?.item;

  if (!rootItem) {
    return items;
  }

  for (const child of asArray(rootItem.item)) {
    walkCommonCartridgeItems(child, (candidate) => {
      items.push(candidate);
    });
  }

  return items;
}

const resourceTypesThatForbidHref = new Set<string>([
  "imsdt_xmlv1p4",
  "imswl_xmlv1p4",
  "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
  "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
]);

const resourceTypesThatForbidAllDependencies = new Set<string>(["imswl_xmlv1p4"]);

const prohibitedDependencyTargetsByType: Record<string, ReadonlySet<string>> = {
  imsdt_xmlv1p4: new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "imsbasiclti_xmlv1p4",
  ]),
  "imsqti_xmlv1p2/imscc_xmlv1p4/assessment": new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "imsbasiclti_xmlv1p4",
  ]),
  "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank": new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "imsbasiclti_xmlv1p4",
  ]),
  webcontent: new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "associatedcontent/imscc_xmlv1p4/learning-application-resource",
    "imsbasiclti_xmlv1p4",
  ]),
  "associatedcontent/imscc_xmlv1p4/learning-application-resource": new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "associatedcontent/imscc_xmlv1p4/learning-application-resource",
    "imsbasiclti_xmlv1p4",
  ]),
  imsbasiclti_xmlv1p4: new Set([
    "imsdt_xmlv1p4",
    "imswl_xmlv1p4",
    "imsqti_xmlv1p2/imscc_xmlv1p4/assessment",
    "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank",
    "webcontent",
    "imsbasiclti_xmlv1p4",
  ]),
};

export const CommonCartridgeManifestProfileSchema = CommonCartridgeManifestRawSchema.superRefine(
  (manifest, context) => {
    const resources = asArray(manifest.resources.resource);
    const resourcesByIdentifier = new Map(resources.map((resource) => [resource.identifier, resource] as const));

    for (const duplicate of collectDuplicates(resources.map((resource) => resource.identifier))) {
      addIssue(context, ["resources", "resource"], `Duplicate resource identifier: ${duplicate}`);
    }

    resources.forEach((resource, resourceIndex) => {
      const files = asArray(resource.file);
      const dependencies = asArray(resource.dependency);

      for (const duplicate of collectDuplicates(files.map((file) => file.href))) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "file"],
          `Resource ${resource.identifier} contains duplicate file href values: ${duplicate}`,
        );
      }

      for (const duplicate of collectDuplicates(dependencies.map((dependency) => dependency.identifierref))) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "dependency"],
          `Resource ${resource.identifier} contains duplicate dependency identifierref values: ${duplicate}`,
        );
      }

      if (resourceTypesThatForbidHref.has(resource.type) && resource.href) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "href"],
          `Resources of type ${resource.type} must not carry href in the active Schematron profile.`,
        );
      }

      if (resource.href && files.length === 0) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "file"],
          `Resource ${resource.identifier} has href but no file entries.`,
        );
      }

      if (resource.href && !files.some((file) => file.href === resource.href)) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "href"],
          `Resource ${resource.identifier} has href ${resource.href} but no matching file/@href.`,
        );
      }

      if (resourceTypesThatForbidAllDependencies.has(resource.type) && dependencies.length > 0) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "dependency"],
          `Resources of type ${resource.type} must not contain dependency entries in the active Schematron profile.`,
        );
      }

      for (const [dependencyIndex, dependency] of dependencies.entries()) {
        if (dependency.identifierref === resource.identifier) {
          addIssue(
            context,
            ["resources", "resource", resourceIndex, "dependency", dependencyIndex, "identifierref"],
            `Resource ${resource.identifier} has a circular dependency on itself.`,
          );
        }

        const target = resourcesByIdentifier.get(dependency.identifierref);
        const prohibitedTargets = prohibitedDependencyTargetsByType[resource.type];

        if (target && prohibitedTargets?.has(target.type)) {
          addIssue(
            context,
            ["resources", "resource", resourceIndex, "dependency", dependencyIndex, "identifierref"],
            `Resource ${resource.identifier} (${resource.type}) must not depend on ${target.identifier} (${target.type}).`,
          );
        }
      }
    });

    const items = collectCommonCartridgeItems(manifest as CommonCartridgeTraversalManifest);
    const questionBankIdentifiers = new Set(
      resources
        .filter((resource) => resource.type === "imsqti_xmlv1p2/imscc_xmlv1p4/question-bank")
        .map((resource) => resource.identifier),
    );

    items.forEach((item, itemIndex) => {
      if (item.identifierref && questionBankIdentifiers.has(item.identifierref)) {
        addIssue(
          context,
          ["organizations", "organization", "item", itemIndex, "identifierref"],
          `Item ${item.identifier} must not reference a question-bank resource.`,
        );
      }

      if (item.identifierref && asArray(item.item).length > 0) {
        addIssue(
          context,
          ["organizations", "organization", "item", itemIndex, "item"],
          `Learning-object item ${item.identifier} must not contain child items when identifierref is present.`,
        );
      }
    });
  },
);

export const CommonCartridgeManifestRawDocumentSchema = strictObject({
  manifest: CommonCartridgeManifestRawSchema,
});

export const CommonCartridgeManifestProfileDocumentSchema = strictObject({
  manifest: CommonCartridgeManifestProfileSchema,
});
