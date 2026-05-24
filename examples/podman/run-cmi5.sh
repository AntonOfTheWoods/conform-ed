#!/usr/bin/env bash
set -euo pipefail
podman run --rm --network host \
  -v "$PWD/examples/configs/cmi5.oracle.json:/config/config.json:ro" \
  -v "$PWD/tmp/agents/cmi5-run:/artifacts:Z" \
  ghcr.io/conform-ed/cmi5-runner:latest \
  run --config /config/config.json --output /artifacts
