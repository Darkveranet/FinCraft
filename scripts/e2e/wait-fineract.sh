#!/usr/bin/env bash
# scripts/e2e/wait-fineract.sh
#
# Blocks until Fineract reports actuator health "UP", or fails after a bounded
# number of tries. Used by every test tier via scripts/e2e/stack-up.sh so all
# suites wait for the same deployed container system the same way.
set -euo pipefail

url="${FINERACT_URL:-https://127.0.0.1:8443}"
tries="${WAIT_TRIES:-90}"        # tries * interval = total budget (default 15m)
interval="${WAIT_INTERVAL:-10}"

for i in $(seq 1 "$tries"); do
  if curl --insecure --fail --silent --max-time 10 \
       "$url/fineract-provider/actuator/health" \
       | grep -q '"status"[[:space:]]*:[[:space:]]*"UP"'; then
    echo "Fineract is UP (after $((i * interval))s)"
    exit 0
  fi
  echo "Waiting for Fineract ($i/$tries)..."
  sleep "$interval"
done
echo "Fineract did not become healthy within $((tries * interval))s" >&2
exit 1
