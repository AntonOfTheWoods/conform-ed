import { z } from "zod";

import { CartridgeBasicLTILinkSchema } from "../shared/ccv1p4_imslticc_v1p4";
import { CurriculumStandardsMetadataSetSchema } from "../shared/ccv1p4_imscsmd_v1p1";
import { WebLinkSchema } from "../shared/ccv1p4_imswl_v1p4";
import {
  NonEmptyStringSchema,
  UriReferenceSchema,
  addIssue,
  asArray,
  collectDuplicates,
  strictObject,
} from "../shared";
import { ThinLomManifestSchema } from "./ccv1p4_lommanifest_v1p0";
import { ThinLomResourceSchema } from "./ccv1p4_lomresource_v1p0";

export const ThinCommonCartridgeResourceTypeSchema = z.enum(["imsbasiclti_xmlv1p4", "imswl_xmlv1p4"]);

export const ThinCommonCartridgeIntendedUseSchema = z.enum(["assignment", "lessonplan", "syllabus", "unspecified"]);

export const ThinCommonCartridgeFileSchema = strictObject({
  href: UriReferenceSchema,
});

export const ThinCommonCartridgeItemSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    identifier: NonEmptyStringSchema,
    identifierref: NonEmptyStringSchema.optional(),
    title: z.string(),
    item: z.array(ThinCommonCartridgeItemSchema).optional(),
  }),
);

export const ThinCommonCartridgeItemOrgSchema: z.ZodTypeAny = z.lazy(() =>
  strictObject({
    identifier: NonEmptyStringSchema,
    item: z.array(ThinCommonCartridgeItemSchema).optional(),
  }),
);

export const ThinCommonCartridgeOrganizationSchema = strictObject({
  identifier: NonEmptyStringSchema,
  structure: z.literal("rooted-hierarchy"),
  title: z.string().optional(),
  item: ThinCommonCartridgeItemOrgSchema,
});

export const ThinCommonCartridgeOrganizationsSchema = strictObject({
  organization: ThinCommonCartridgeOrganizationSchema.optional(),
});

export const ThinCommonCartridgeManifestMetadataSchema = strictObject({
  schema: z.enum(["IMS Thin Common Cartridge", "IMS K-12 Thin Common Cartridge"]),
  schemaversion: z.literal("1.4.0"),
  lom: ThinLomManifestSchema,
  curriculumStandardsMetadataSet: CurriculumStandardsMetadataSetSchema.optional(),
});

export const ThinCommonCartridgeResourceMetadataSchema = strictObject({
  schema: z.string().optional(),
  schemaversion: z.string().optional(),
  lom: ThinLomResourceSchema.optional(),
  curriculumStandardsMetadataSet: z.array(CurriculumStandardsMetadataSetSchema).optional(),
});

export const ThinCommonCartridgeResourceSchema = strictObject({
  identifier: NonEmptyStringSchema,
  type: ThinCommonCartridgeResourceTypeSchema,
  href: UriReferenceSchema.optional(),
  xmlBase: z.string().optional(),
  intendeduse: ThinCommonCartridgeIntendedUseSchema.optional(),
  metadata: ThinCommonCartridgeResourceMetadataSchema.optional(),
  file: z.array(ThinCommonCartridgeFileSchema).optional(),
  cartridge_basiclti_link: CartridgeBasicLTILinkSchema.optional(),
  webLink: WebLinkSchema.optional(),
});

export const ThinCommonCartridgeResourcesSchema = strictObject({
  xmlBase: z.string().optional(),
  resource: z.array(ThinCommonCartridgeResourceSchema).optional(),
});

export const ThinCommonCartridgeManifestRawSchema = strictObject({
  identifier: NonEmptyStringSchema,
  xmlBase: z.string().optional(),
  metadata: ThinCommonCartridgeManifestMetadataSchema,
  organizations: ThinCommonCartridgeOrganizationsSchema,
  resources: ThinCommonCartridgeResourcesSchema,
});

type ThinCommonCartridgeTraversalItem = {
  identifier: string;
  identifierref?: string;
  item?: ThinCommonCartridgeTraversalItem[];
};

type ThinCommonCartridgeTraversalManifest = {
  organizations: {
    organization?: {
      item: {
        item?: ThinCommonCartridgeTraversalItem[];
      };
    };
  };
};

function walkThinCommonCartridgeItems(
  item: ThinCommonCartridgeTraversalItem,
  visit: (candidate: ThinCommonCartridgeTraversalItem) => void,
) {
  visit(item);
  for (const child of asArray(item.item)) {
    walkThinCommonCartridgeItems(child, visit);
  }
}

function collectThinCommonCartridgeItems(
  manifest: ThinCommonCartridgeTraversalManifest,
): ThinCommonCartridgeTraversalItem[] {
  const items: ThinCommonCartridgeTraversalItem[] = [];
  const rootItem = manifest.organizations.organization?.item;

  if (!rootItem) {
    return items;
  }

  for (const child of asArray(rootItem.item)) {
    walkThinCommonCartridgeItems(child, (candidate) => {
      items.push(candidate);
    });
  }

  return items;
}

export const ThinCommonCartridgeManifestProfileSchema = ThinCommonCartridgeManifestRawSchema.superRefine(
  (manifest, context) => {
    const resources = asArray(manifest.resources.resource);

    for (const duplicate of collectDuplicates(resources.map((resource) => resource.identifier))) {
      addIssue(context, ["resources", "resource"], `Duplicate resource identifier: ${duplicate}`);
    }

    resources.forEach((resource, resourceIndex) => {
      const files = asArray(resource.file);

      for (const duplicate of collectDuplicates(files.map((file) => file.href))) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "file"],
          `Resource ${resource.identifier} contains duplicate file href values: ${duplicate}`,
        );
      }

      const hasBasicLti = Boolean(resource.cartridge_basiclti_link);
      const hasWebLink = Boolean(resource.webLink);

      if (resource.type === "imsbasiclti_xmlv1p4" && !hasBasicLti) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "cartridge_basiclti_link"],
          `Thin resource ${resource.identifier} must contain cartridge_basiclti_link when type is imsbasiclti_xmlv1p4.`,
        );
      }

      if (resource.type === "imswl_xmlv1p4" && !hasWebLink) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "webLink"],
          `Thin resource ${resource.identifier} must contain webLink when type is imswl_xmlv1p4.`,
        );
      }

      if (resource.type === "imsbasiclti_xmlv1p4" && hasWebLink) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "webLink"],
          `Thin resource ${resource.identifier} must not contain webLink when type is imsbasiclti_xmlv1p4.`,
        );
      }

      if (resource.type === "imswl_xmlv1p4" && hasBasicLti) {
        addIssue(
          context,
          ["resources", "resource", resourceIndex, "cartridge_basiclti_link"],
          `Thin resource ${resource.identifier} must not contain cartridge_basiclti_link when type is imswl_xmlv1p4.`,
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
    });

    const items = collectThinCommonCartridgeItems(manifest as ThinCommonCartridgeTraversalManifest);

    items.forEach((item, itemIndex) => {
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

export const ThinCommonCartridgeManifestRawDocumentSchema = strictObject({
  manifest: ThinCommonCartridgeManifestRawSchema,
});

export const ThinCommonCartridgeManifestProfileDocumentSchema = strictObject({
  manifest: ThinCommonCartridgeManifestProfileSchema,
});
// Inferred types from exported Zod validators.
export type ThinCommonCartridgeResourceType = z.infer<typeof ThinCommonCartridgeResourceTypeSchema>;
export type ThinCommonCartridgeIntendedUse = z.infer<typeof ThinCommonCartridgeIntendedUseSchema>;
export type ThinCommonCartridgeFile = z.infer<typeof ThinCommonCartridgeFileSchema>;
export type ThinCommonCartridgeOrganization = z.infer<typeof ThinCommonCartridgeOrganizationSchema>;
export type ThinCommonCartridgeOrganizations = z.infer<typeof ThinCommonCartridgeOrganizationsSchema>;
export type ThinCommonCartridgeManifestMetadata = z.infer<typeof ThinCommonCartridgeManifestMetadataSchema>;
export type ThinCommonCartridgeResourceMetadata = z.infer<typeof ThinCommonCartridgeResourceMetadataSchema>;
export type ThinCommonCartridgeResource = z.infer<typeof ThinCommonCartridgeResourceSchema>;
export type ThinCommonCartridgeResources = z.infer<typeof ThinCommonCartridgeResourcesSchema>;
export type ThinCommonCartridgeManifestRaw = z.infer<typeof ThinCommonCartridgeManifestRawSchema>;
export type ThinCommonCartridgeManifestProfile = z.infer<typeof ThinCommonCartridgeManifestProfileSchema>;
export type ThinCommonCartridgeManifestRawDocument = z.infer<typeof ThinCommonCartridgeManifestRawDocumentSchema>;
export type ThinCommonCartridgeManifestProfileDocument = z.infer<
  typeof ThinCommonCartridgeManifestProfileDocumentSchema
>;
