#!/usr/bin/env bash
set -euo pipefail

LRSQL_PORT="${LRSQL_PORT:-8080}"
LRSQL_API_KEY="${LRSQL_API_KEY_DEFAULT:-${LRSQL_USER:-janedoe}}"
LRSQL_API_SECRET="${LRSQL_API_SECRET_DEFAULT:-${LRSQL_PASSWORD:-supersecret}}"
LRS_VERSION="${LRS_VERSION:-2.0.0}"

curl -fsS \
  --header "X-Experience-API-Version: ${LRS_VERSION}" \
  --user "${LRSQL_API_KEY}:${LRSQL_API_SECRET}" \
  "http://localhost:${LRSQL_PORT}/xapi/about"
