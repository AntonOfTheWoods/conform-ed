#!/usr/bin/env bash
set -euo pipefail
docker run --rm --network host \
  -v "$PWD/examples/configs/lti13.core-launch.json:/config/config.json:ro" \
  -v "$PWD/tmp/agents/lti13-run:/artifacts" \
  ghcr.io/conform-ed/lti13-runner:latest \
  run --config /config/config.json --output /artifacts
