import { z } from "zod";

import {
  CreateSectionRequestSchema,
  CreateSectionResponseSchema,
  GetSectionResponseSchema,
  CreateSessionRequestSchema,
  CreateSessionResponseSchema,
  SubmitResultsRequestSchema,
  SubmitResultsResponseSchema,
  EndSessionRequestSchema,
  EndSessionResponseSchema,
  EndSectionRequestSchema,
  EndSectionResponseSchema,
  ErrorResponseSchema,
} from "./shared";

const EmptyPayloadSchema = z.undefined();

/**
 * CAT REST Operation Bindings - extracted from CAT v1.0 specification
 * Each operation defines the HTTP method, path, request payload schema, and response payload schemas.
 */

export const CatV1P0RestBindingOperations = {
  createSection: {
    method: "POST",
    path: "/sections",
    requestPayload: CreateSectionRequestSchema,
    successResponsePayload: CreateSectionResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },

  getSection: {
    method: "GET",
    path: "/sections/{sectionId}",
    requestPayload: EmptyPayloadSchema,
    successResponsePayload: GetSectionResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },

  createSession: {
    method: "POST",
    path: "/sessions",
    requestPayload: CreateSessionRequestSchema,
    successResponsePayload: CreateSessionResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },

  submitResults: {
    method: "POST",
    path: "/sessions/{sessionId}/results",
    requestPayload: SubmitResultsRequestSchema,
    successResponsePayload: SubmitResultsResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },

  endSession: {
    method: "POST",
    path: "/sessions/{sessionId}/end",
    requestPayload: EndSessionRequestSchema,
    successResponsePayload: EndSessionResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },

  endSection: {
    method: "POST",
    path: "/sections/{sectionId}/end",
    requestPayload: EndSectionRequestSchema,
    successResponsePayload: EndSectionResponseSchema,
    errorResponsePayload: ErrorResponseSchema,
  },
} as const;

export type CatV1P0Operations = typeof CatV1P0RestBindingOperations;
