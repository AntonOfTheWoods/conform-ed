#!/usr/bin/env bash
set -euo pipefail

RUN_LRS_RUNNER_CONTAINER="${RUN_LRS_RUNNER_CONTAINER:-false}"
COMPOSE_FILE="infra/compose/podman-compose.lrsql.yaml"
LRSQL_UP_TIMEOUT_SECONDS="${LRSQL_UP_TIMEOUT_SECONDS:-90}"
LRSQL_RUNNER_TIMEOUT_SECONDS="${LRSQL_RUNNER_TIMEOUT_SECONDS:-300}"
LRSQL_PORT="${LRSQL_PORT:-8080}"
LRS_RUNNER_IMAGE="${LRS_RUNNER_IMAGE:-localhost/conform-ed/lrs-runner:lrs-only}"
LRS_RUNNER_BUILD_TIMEOUT_SECONDS="${LRS_RUNNER_BUILD_TIMEOUT_SECONDS:-180}"

compose_cmd=(podman compose -f "${COMPOSE_FILE}")

if ss -ltn | awk '{print $4}' | rg -q "(^|:)${LRSQL_PORT}$"; then
  echo "Cannot start LRSQL stack: host port ${LRSQL_PORT} is already in use." >&2
  echo "Tip: set LRSQL_PORT to a free port (for example, LRSQL_PORT=18080 bun run lrsql:up)." >&2
  echo "Current listeners on ${LRSQL_PORT}:" >&2
  podman ps --format '{{.Names}}\t{{.Ports}}' | rg ":${LRSQL_PORT}->" >&2 || true
  exit 125
fi

echo "Starting db + lrs (timeout ${LRSQL_UP_TIMEOUT_SECONDS}s)..."
timeout --preserve-status "${LRSQL_UP_TIMEOUT_SECONDS}" "${compose_cmd[@]}" up -d db lrs

if [[ "${RUN_LRS_RUNNER_CONTAINER}" == "true" ]]; then
  echo "Running LRS Runner in a container..."
  bun run lrsql:wait
  bun run lrsql:auth:check >/dev/null

  if ! podman image exists "${LRS_RUNNER_IMAGE}"; then
    echo "Building ${LRS_RUNNER_IMAGE} (timeout ${LRS_RUNNER_BUILD_TIMEOUT_SECONDS}s)..."
    timeout --preserve-status "${LRS_RUNNER_BUILD_TIMEOUT_SECONDS}" \
      podman build -f infra/container/lrs-runner/Containerfile -t "${LRS_RUNNER_IMAGE}" .
  fi

  compose_network="$(podman inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{printf "%s" $k}}{{end}}' compose_db_1)"
  if [[ -z "${compose_network}" ]]; then
    echo "Could not determine compose network from compose_db_1." >&2
    exit 1
  fi

  timeout --preserve-status "${LRSQL_RUNNER_TIMEOUT_SECONDS}" podman run --rm \
    --network "${compose_network}" \
    -e LRS_BASE_URL="${LRS_BASE_URL:-http://lrs:8080/xapi}" \
    -e LRS_USERNAME="${LRS_USERNAME:-${LRSQL_API_KEY_DEFAULT:-janedoe}}" \
    -e LRS_PASSWORD="${LRS_PASSWORD:-${LRSQL_API_SECRET_DEFAULT:-supersecret}}" \
    -e LRS_SPEC_VERSIONS="${LRS_SPEC_VERSIONS:-1.0.3,2.0.0}" \
    -e LRS_TIMEOUT_SECONDS="${LRS_TIMEOUT_SECONDS:-60}" \
    -e LRS_TOTAL_TIMEOUT_SECONDS="${LRS_TOTAL_TIMEOUT_SECONDS:-300}" \
    "${LRS_RUNNER_IMAGE}"
fi
