#!/usr/bin/env bash
set -euo pipefail

LRS_VERSION="${LRS_VERSION:-2.0.0}"
LRSQL_PORT="${LRSQL_PORT:-8080}"
LRSQL_API_KEY="${LRSQL_API_KEY_DEFAULT:-${LRSQL_USER:-janedoe}}"
LRSQL_API_SECRET="${LRSQL_API_SECRET_DEFAULT:-${LRSQL_PASSWORD:-supersecret}}"
LRS_RUN_OUT="${LRS_RUN_OUT:-tmp/agents/lrs-run-${LRS_VERSION}.json}"

if [[ "${LRS_VERSION}" == "1.0.3" ]]; then
  export LRSQL_SUPPORTED_VERSIONS="1.0.3"
  export LRSQL_ENABLE_STRICT_VERSION="true"
else
  export LRSQL_SUPPORTED_VERSIONS="1.0.3,2.0.0"
  export LRSQL_ENABLE_STRICT_VERSION="false"
fi

bun run lrsql:reset:best-effort
bun run lrsql:wait
bun run lrsql:auth:check >/dev/null

bun run scripts/export-validate-run.ts \
  --base-url "http://localhost:${LRSQL_PORT}/xapi" \
  --version "${LRS_VERSION}" \
  --username "${LRSQL_API_KEY}" \
  --password "${LRSQL_API_SECRET}" \
  --out "${LRS_RUN_OUT}"

export LRS_RUN_OUT
export LRS_VERSION

bun -e 'import { readFileSync } from "node:fs";
const filePath = process.env.LRS_RUN_OUT;
const parsed = JSON.parse(readFileSync(filePath, "utf8"));
const run = parsed?.run;
if (!run || typeof run !== "object") {
  throw new Error(`validation artifact missing run payload: ${filePath}`);
}
const events = Array.isArray(run.events) ? run.events.length : null;
console.log(JSON.stringify({
  mode: "validation",
  target: "lrsql",
  xapiVersion: run.version ?? process.env.LRS_VERSION ?? null,
  artifact: filePath,
  status: run.status ?? null,
  events,
}, null, 2));'
