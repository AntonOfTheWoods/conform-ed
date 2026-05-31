import { z } from "zod";

import { NonEmptyStringSchema, strictObject } from "./shared";

export const CurriculumStandardsLabelledGUIDSchema = strictObject({
  label: z.string().optional(),
  GUID: NonEmptyStringSchema,
});

export const CurriculumStandardsSetOfGUIDsSchema = strictObject({
  labelledGUID: z.array(CurriculumStandardsLabelledGUIDSchema).min(1),
  region: z.string().optional(),
  version: z.string().optional(),
});

export const CurriculumStandardsMetadataSchema = strictObject({
  setOfGUIDs: z.array(CurriculumStandardsSetOfGUIDsSchema).min(1),
  providerId: z.string().optional(),
});

export const CurriculumStandardsMetadataSetSchema = strictObject({
  curriculumStandardsMetadata: z.array(CurriculumStandardsMetadataSchema).min(1),
  resourceLabel: z.string().optional(),
  resourcePartId: z.string().optional(),
});

export const CurriculumStandardsMetadataSetDocumentSchema = strictObject({
  curriculumStandardsMetadataSet: CurriculumStandardsMetadataSetSchema,
});
// Inferred types from exported Zod validators.
export type CurriculumStandardsLabelledGUID = z.infer<typeof CurriculumStandardsLabelledGUIDSchema>;
export type CurriculumStandardsSetOfGUIDs = z.infer<typeof CurriculumStandardsSetOfGUIDsSchema>;
export type CurriculumStandardsMetadata = z.infer<typeof CurriculumStandardsMetadataSchema>;
export type CurriculumStandardsMetadataSet = z.infer<typeof CurriculumStandardsMetadataSetSchema>;
export type CurriculumStandardsMetadataSetDocument = z.infer<typeof CurriculumStandardsMetadataSetDocumentSchema>;
