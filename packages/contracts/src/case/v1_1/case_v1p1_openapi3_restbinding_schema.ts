import { z } from "zod";
import {
  CFAssociationSchema,
  CFAssociationSetSchema,
  CFConceptSetSchema,
  CFItemSchema,
  CFItemTypeSetSchema,
  CFLicenseSchema,
  CFPackageSchema,
  CFRubricSchema,
  CFSubjectSetSchema,
  ImsxStatusInfoSchema,
} from "./shared";

export const CaseV1P1OpenApi3OperationSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  path: z.string(),
  requestPayload: z.optional(z.record(z.string(), z.unknown())),
  successResponsePayload: z.record(z.string(), z.unknown()),
  errorResponsePayload: z.record(z.string(), z.unknown()),
});

export type CaseV1P1OpenApi3Operation = z.infer<typeof CaseV1P1OpenApi3OperationSchema>;

export const CaseV1P1RestBindingOperations = {
  getCFAssociation: {
    method: "GET",
    path: "/cfAssociations/{id}",
    successResponsePayload: CFAssociationSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  listCFAssociations: {
    method: "GET",
    path: "/cfAssociations",
    successResponsePayload: CFAssociationSetSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFConcept: {
    method: "GET",
    path: "/cfConcepts/{id}",
    successResponsePayload: z.object({
      cfConcept: z.record(z.string(), z.unknown()),
    }),
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  listCFConcepts: {
    method: "GET",
    path: "/cfConcepts",
    successResponsePayload: CFConceptSetSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFItem: {
    method: "GET",
    path: "/cfItems/{id}",
    successResponsePayload: CFItemSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  listCFItems: {
    method: "GET",
    path: "/cfItems",
    successResponsePayload: CFItemSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFItemType: {
    method: "GET",
    path: "/cfItemTypes/{id}",
    successResponsePayload: z.record(z.string(), z.unknown()),
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  listCFItemTypes: {
    method: "GET",
    path: "/cfItemTypes",
    successResponsePayload: CFItemTypeSetSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFLicense: {
    method: "GET",
    path: "/cfLicenses/{id}",
    successResponsePayload: CFLicenseSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFPackage: {
    method: "GET",
    path: "/cfPackages/{id}",
    successResponsePayload: CFPackageSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  getCFRubric: {
    method: "GET",
    path: "/cfRubrics/{id}",
    successResponsePayload: CFRubricSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,

  listCFSubjects: {
    method: "GET",
    path: "/cfSubjects",
    successResponsePayload: CFSubjectSetSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as unknown as CaseV1P1OpenApi3Operation,
};

export type CaseV1P1RestBindingOperations = typeof CaseV1P1RestBindingOperations;
