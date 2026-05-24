# Adapter Contract

## Purpose

Adapters isolate platform-specific workflow APIs from protocol runner cores.

This is required for cmi5 and LTI 1.3 where orchestration paths differ significantly by platform.

## Transport

Current contract transport is HTTP + JSON.

Reasons:

1. language-neutral integration for third parties.
2. independent deployment and versioning from runner images.
3. simple observability and debugging.

## Required Endpoints

All adapters must expose:

- `GET /health`
- `GET /v1/capabilities`

## Authentication Contract

Default mode is token-auth required.

Supported environment inputs:

- `ADAPTER_AUTH_REQUIRED` (`true` by default)
- `ADAPTER_AUTH_TOKEN`
- `ADAPTER_AUTH_TOKEN_NEXT` (rotation window)
- `ADAPTER_AUTH_TOKENS` (comma-separated fallback set)

Behavioral rules:

1. if auth is required and no tokens are configured, return structured 500.
2. if bearer token is missing or invalid, return structured 401.
3. responses include `www-authenticate` header.
4. token values are never echoed in payloads.

## Capability Discovery

`GET /v1/capabilities` must provide:

- `contractVersion`
- `adapterName`
- `adapterVersion`
- `profiles`
- `operations`

Runners should verify capabilities before running target flows.

## Error Shape

Adapter errors return:

```json
{
  "error": {
    "code": "string_code",
    "message": "human readable message",
    "details": {}
  }
}
```

## Versioning Policy

Adapter contract versions track runner contract compatibility.

- backward-compatible additions: minor
- breaking behavior/shape changes: major

## Current Reference Profiles

- `cmi5-lms-v1`
- `lti13-tool-v1`

## Non-Goals

- in-process adapter loading in v0.x
- database-level adapter integration
- platform-specific implicit assumptions in shared runner code
