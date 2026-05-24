#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${LRSQL_COMPOSE_FILE:-infra/compose/podman-compose.lrsql.yaml}"
PROJECT_NAME="${LRSQL_PROJECT_NAME:-conform-ed-lrsql}"

set +e
podman compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" down -v
down_status=$?
set -e

podman compose -f "${COMPOSE_FILE}" -p "${PROJECT_NAME}" up -d

exit "${down_status}"
