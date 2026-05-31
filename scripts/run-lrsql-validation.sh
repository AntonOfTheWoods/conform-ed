#!/usr/bin/env bash
set -euo pipefail

LRSQL_PORT="${LRSQL_PORT:-8080}"
LRS_TIMEOUT_SECONDS="${LRS_TIMEOUT_SECONDS:-60}"
LRS_TOTAL_TIMEOUT_SECONDS="${LRS_TOTAL_TIMEOUT_SECONDS:-300}"

export LRS_BASE_URL="${LRS_BASE_URL:-http://localhost:${LRSQL_PORT}/xapi}"
export LRS_USERNAME="${LRS_USERNAME:-${LRSQL_API_KEY_DEFAULT:-${LRSQL_USER:-janedoe}}}"
export LRS_PASSWORD="${LRS_PASSWORD:-${LRSQL_API_SECRET_DEFAULT:-${LRSQL_PASSWORD:-supersecret}}}"
export LRS_SPEC_VERSIONS="${LRS_SPEC_VERSIONS:-1.0.3,2.0.0}"
export LRS_TIMEOUT_SECONDS
export LRS_TOTAL_TIMEOUT_SECONDS
export LRS_RUN_OUT_DIR="${LRS_RUN_OUT_DIR:-tmp/agents}"

bun run lrsql:reset:best-effort
bun run lrsql:wait
bun run lrsql:auth:check >/dev/null

bash ./scripts/run-lrs-runner-dual.sh
