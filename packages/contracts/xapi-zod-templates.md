# xAPI Zod templates

## Scope

This bundle covers:

- xAPI 1.0.3 statement/data models
- IEEE xAPI 2.0 statement/data models
- Statement result containers and Person objects
- LRS document resources (State, AgentProfile, ActivityProfile)
- Statement, Agents, and Activities resource query shapes
- Document id list responses for State/Profile resources
- LRS resource and endpoint schemas
- HTTP transport and concurrency control (ETags, conditional requests)
- Multipart attachment transmission with binary hashing
- Error handling and HTTP status codes
- About/version metadata

## Source references

These documents were used as normative references while modeling the xAPI payload contracts:

- ADL xAPI 1.0.3 spec documents:
  - `xAPI-About.md`
  - `xAPI-Data.md`
  - `xAPI-Communication.md` (including LRS and statement submission guidance)
- IEEE xAPI 2.0 base-standard documents:
  - `9274.1.1 xAPI Base Standard Front Matter.md`
  - `9274.1.1 xAPI Base Standard Overview.md`
  - `9274.1.1 xAPI Base Standard for Content.md`
  - `9274.1.1 xAPI Base Standard for LRSs.md`

## Entry points

- `@conform-ed/contracts/xapi`
- `@conform-ed/contracts/xapi/v1_0_3`
- `@conform-ed/contracts/xapi/v2_0`

## Schemas

### Core Data Models

- `Agent` / `Group` — Actor types with inverse-functional identifier validation
- `Person` — Aggregated Agents Resource response with array-valued identifiers
- `Verb` — Action vocabulary with display language support
- `Activity` — Learning object with optional activity definition
- `Result` — Statement outcome with score, success, completion, and duration
- `Context` — Contextual information including registration, language, and activities
- `ContextAgent` / `ContextGroup` (IEEE 2.0) — Statement-scoped contextual agents/groups with optional `relevantTypes`
- `Attachment` — Binary attachment metadata with SHA2 hashing
- `Statement` — Complete xAPI statement combining actor, verb, object, result, and context
- `StatementResult` — `/statements` query response envelope containing `statements` plus optional `more`

### LRS Document Resources

- `StatementsQuery` — `/statements` query parameters (statement ids, agent/activity filters, date windows, format, attachments)
- `AgentsResourceQuery` — `/agents` request payload/query wrapper for a target Agent
- `ActivitiesResourceQuery` — `/activities` request payload/query wrapper for a target Activity id
- `StateDocumentQuery` — Request parameters for state document access (activityId, agent, stateId, registration)
- `StateDocumentListingQuery` — Request parameters for listing state ids, including optional `since`
- `AgentProfileDocumentQuery` — Request parameters for agent profile access
- `AgentProfileDocumentListingQuery` — Request parameters for listing agent profile ids
- `ActivityProfileDocumentQuery` — Request parameters for activity profile access
- `ActivityProfileDocumentListingQuery` — Request parameters for listing activity profile ids
- `XapiDocument` — Response envelope for document retrieval (contentType, body, etag, lastModified)
- `XapiDocumentIdList` — Top-level JSON array response for State/Profile id listings

### Transport and Concurrency

- `HttpMethod` — Enumeration of LRS HTTP methods (GET, HEAD, PUT, POST, DELETE)
- `RequestHeader` — HTTP request headers supported by xAPI (Authorization, If-Match, etc.)
- `ResponseHeader` — HTTP response headers (ETag, X-Experience-API-Version, etc.)
- `Concurrency` — Concurrency control with ETag and conditional request headers (If-Match, If-None-Match)
- `ErrorCode` — Standard HTTP error codes returned by LRS (400, 401, 403, 404, 409, 411, 412, 413, 500, 501)
- `ErrorResponse` — Error payload with code, message, and optional details

### Multipart Attachments

- `MultipartAttachmentPart` — Binary attachment data with required Content-Type, Content-Transfer-Encoding (binary), and X-Experience-API-Hash headers
- `MultipartRequest` — Full multipart/mixed request envelope with JSON statement(s) followed by binary attachment parts

### Service Metadata

- `AboutResource` — LRS about/version endpoint response listing supported xAPI versions
- `Resource` — Endpoint definition with name, description, and supported HTTP methods

## Notes

- Structured statement objects and all domain types are strict (`strictObject()`), catching misspelled or extra properties.
- Document bodies are intentionally permissive (`z.unknown()`) because xAPI allows arbitrary document content types.
- Agent and Group schemas enforce at-least-one-identifier validation via `.refine()`, matching the spec intent that agents must be identifiable.
- Person objects are modeled separately from Agents because the `/agents` resource returns array-valued identifier fields rather than single IFIs.
- Concurrency control and multipart transmission are modeled as separate concerns for flexibility in HTTP client implementations.
- Version 2.0 reuses the 1.0.3 model where structurally equivalent, but overrides Context/Statement-family schemas to add IEEE `contextAgent`, `contextGroup`, and `relevantTypes`.
- Strict error codes (400, 401, 403, 404, 409, 411, 412, 413, 500, 501) align with xAPI specification guidance for LRS error responses.
