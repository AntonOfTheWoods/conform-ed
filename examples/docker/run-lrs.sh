#!/usr/bin/env bash
set -euo pipefail
docker run --rm --network host \
  -v "$PWD/examples/configs/lrs.basic.json:/config/config.json:ro" \
  -v "$PWD/tmp/agents/lrs-run:/artifacts" \
  ghcr.io/conform-ed/lrs-runner:latest \
  run --config /config/config.json --output /artifacts
