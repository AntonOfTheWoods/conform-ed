#!/usr/bin/env bash
set -euo pipefail

LRS_BASE_URL="${LRS_BASE_URL:-}"
LRS_VERSION="${LRS_VERSION:-2.0.0}"
LRS_USERNAME="${LRS_USERNAME:-}"
LRS_PASSWORD="${LRS_PASSWORD:-}"
LRS_RUN_OUT="${LRS_RUN_OUT:-tmp/agents/lrs-run-external-${LRS_VERSION}.json}"

if [[ -z "${LRS_BASE_URL}" ]]; then
  echo "LRS_BASE_URL is required." >&2
  exit 1
fi

if [[ ( -n "${LRS_USERNAME}" && -z "${LRS_PASSWORD}" ) || ( -z "${LRS_USERNAME}" && -n "${LRS_PASSWORD}" ) ]]; then
  echo "Provide both LRS_USERNAME and LRS_PASSWORD together." >&2
  exit 1
fi

command=(
  bun
  run
  apps/lrs-runner/src/cli.ts
  run
  --base-url
  "${LRS_BASE_URL}"
  --version
  "${LRS_VERSION}"
)

if [[ -n "${LRS_USERNAME}" ]]; then
  command+=(--username "${LRS_USERNAME}" --password "${LRS_PASSWORD}")
fi

mkdir -p "$(dirname "${LRS_RUN_OUT}")"
"${command[@]}" | tee "${LRS_RUN_OUT}"
