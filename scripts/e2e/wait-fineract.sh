#!/usr/bin/env bash
set -euo pipefail
url="${FINERACT_URL:-https://127.0.0.1:8443}"
for i in $(seq 1 90); do
  if curl --insecure --fail --silent --max-time 10 "$url/fineract-provider/actuator/health" | grep -q '"status"[[:space:]]*:[[:space:]]*"UP"'; then
    echo "Fineract is UP"
    exit 0
  fi
  echo "Waiting for Fineract ($i/90)..."
  sleep 10
done
echo "Fineract did not become healthy" >&2
exit 1
