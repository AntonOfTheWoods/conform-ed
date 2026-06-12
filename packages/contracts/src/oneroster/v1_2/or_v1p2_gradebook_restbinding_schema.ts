import { z } from "zod";

import {
  AssessmentLineItemSetSchema,
  AssessmentResultSetSchema,
  CategorySetSchema,
  GuidPairSetSchema,
  LineItemSetSchema,
  ResultSetSchema,
  ScoreScaleSetSchema,
  SingleAssessmentLineItemSchema,
  SingleAssessmentResultSchema,
  SingleCategorySchema,
  SingleLineItemSchema,
  SingleResultSchema,
  SingleScoreScaleSchema,
} from "./or_v1p2_gradebook_service_schema";
import { ImsxStatusInfoSchema } from "./shared";

const EmptyPayloadSchema = z.undefined();

function gradebookGetOperation(path: string, successResponsePayload: z.ZodType) {
  return {
    method: "GET",
    path,
    requestPayload: EmptyPayloadSchema,
    successResponsePayload,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

function gradebookPostOperation(path: string, requestPayload: z.ZodType, successResponsePayload: z.ZodType) {
  return {
    method: "POST",
    path,
    requestPayload,
    successResponsePayload,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

function gradebookPutOperation(path: string, requestPayload: z.ZodType) {
  return {
    method: "PUT",
    path,
    requestPayload,
    successResponsePayload: EmptyPayloadSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

function gradebookDeleteOperation(path: string) {
  return {
    method: "DELETE",
    path,
    requestPayload: EmptyPayloadSchema,
    successResponsePayload: EmptyPayloadSchema,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

export const GradebookRestBindingOperationSchemas = {
  getAllAssessmentLineItems: gradebookGetOperation("/assessmentLineItems", AssessmentLineItemSetSchema),
  getAssessmentLineItem: gradebookGetOperation("/assessmentLineItems/{sourcedId}", SingleAssessmentLineItemSchema),
  deleteAssessmentLineItem: gradebookDeleteOperation("/assessmentLineItems/{sourcedId}"),
  putAssessmentLineItem: gradebookPutOperation("/assessmentLineItems/{sourcedId}", SingleAssessmentLineItemSchema),
  getAllAssessmentResults: gradebookGetOperation("/assessmentResults", AssessmentResultSetSchema),
  getAssessmentResult: gradebookGetOperation("/assessmentResults/{sourcedId}", SingleAssessmentResultSchema),
  deleteAssessmentResult: gradebookDeleteOperation("/assessmentResults/{sourcedId}"),
  putAssessmentResult: gradebookPutOperation("/assessmentResults/{sourcedId}", SingleAssessmentResultSchema),
  getAllCategories: gradebookGetOperation("/categories", CategorySetSchema),
  getCategory: gradebookGetOperation("/categories/{sourcedId}", SingleCategorySchema),
  deleteCategory: gradebookDeleteOperation("/categories/{sourcedId}"),
  putCategory: gradebookPutOperation("/categories/{sourcedId}", SingleCategorySchema),
  postResultsForAcademicSessionForClass: gradebookPostOperation(
    "/classes/{classSourcedId}/academicSessions/{academicSessionSourcedId}/results",
    ResultSetSchema,
    GuidPairSetSchema,
  ),
  getCategoriesForClass: gradebookGetOperation("/classes/{classSourcedId}/categories", CategorySetSchema),
  getLineItemsForClass: gradebookGetOperation("/classes/{classSourcedId}/lineItems", LineItemSetSchema),
  postLineItemsForClass: gradebookPostOperation(
    "/classes/{classSourcedId}/lineItems",
    LineItemSetSchema,
    GuidPairSetSchema,
  ),
  getResultsForLineItemForClass: gradebookGetOperation(
    "/classes/{classSourcedId}/lineItems/{lineItemSourcedId}/results",
    ResultSetSchema,
  ),
  getResultsForClass: gradebookGetOperation("/classes/{classSourcedId}/results", ResultSetSchema),
  getScoreScalesForClass: gradebookGetOperation("/classes/{classSourcedId}/scoreScales", ScoreScaleSetSchema),
  getResultsForStudentForClass: gradebookGetOperation(
    "/classes/{classSourcedId}/students/{studentSourcedId}/results",
    ResultSetSchema,
  ),
  getAllLineItems: gradebookGetOperation("/lineItems", LineItemSetSchema),
  postResultsForLineItem: gradebookPostOperation(
    "/lineItems/{lineItemSourcedId}/results",
    ResultSetSchema,
    GuidPairSetSchema,
  ),
  getLineItem: gradebookGetOperation("/lineItems/{sourcedId}", SingleLineItemSchema),
  deleteLineItem: gradebookDeleteOperation("/lineItems/{sourcedId}"),
  putLineItem: gradebookPutOperation("/lineItems/{sourcedId}", SingleLineItemSchema),
  getAllResults: gradebookGetOperation("/results", ResultSetSchema),
  getResult: gradebookGetOperation("/results/{sourcedId}", SingleResultSchema),
  deleteResult: gradebookDeleteOperation("/results/{sourcedId}"),
  putResult: gradebookPutOperation("/results/{sourcedId}", SingleResultSchema),
  postLineItemsForSchool: gradebookPostOperation(
    "/schools/{schoolSourcedId}/lineItems",
    LineItemSetSchema,
    GuidPairSetSchema,
  ),
  getScoreScalesForSchool: gradebookGetOperation("/schools/{schoolSourcedId}/scoreScales", ScoreScaleSetSchema),
  getAllScoreScales: gradebookGetOperation("/scoreScales", ScoreScaleSetSchema),
  getScoreScale: gradebookGetOperation("/scoreScales/{sourcedId}", SingleScoreScaleSchema),
  deleteScoreScale: gradebookDeleteOperation("/scoreScales/{sourcedId}"),
  putScoreScale: gradebookPutOperation("/scoreScales/{sourcedId}", SingleScoreScaleSchema),
} as const;
