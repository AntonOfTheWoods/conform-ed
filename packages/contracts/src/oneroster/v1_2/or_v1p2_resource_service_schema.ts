import { z } from "zod";

import {
  DateTimeSchema,
  EntityStatusSchema,
  extensibleEnum,
  MetadataSchema,
  SourcedIdSchema,
  strictObject,
} from "./shared";

export const ResourceRoleSchema = extensibleEnum([
  "administrator",
  "aide",
  "guardian",
  "parent",
  "proctor",
  "relative",
  "student",
  "teacher",
]);

export const ResourceSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string().optional(),
  roles: z.array(ResourceRoleSchema).optional(),
  importance: z.enum(["primary", "secondary"]).optional(),
  vendorResourceId: z.string(),
  vendorId: z.string().optional(),
  applicationId: z.string().optional(),
});

export const ResourceSetSchema = strictObject({
  resources: z.array(ResourceSchema).optional(),
});

export const SingleResourceSchema = strictObject({
  resource: ResourceSchema,
});
