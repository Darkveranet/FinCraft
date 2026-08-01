#!/usr/bin/env bash
# scripts/e2e/stack-up.sh
#
# Single source of truth for standing up "the deployed container system" that
# ALL Fineract-touching tests run against: the disposable Postgres + Fineract
# stack defined in tools/api-automation/docker-compose.fineract.yml.
#
# Both test workflows (tests.yml container-e2e, isolated-fineract-e2e.yml) call
# this instead of pointing at the shared public demo or cloning Fineract's own
# compose file — so every tier exercises the same backend.
#
#   scripts/e2e/stack-up.sh
#   # ... run playwright ...
#   scripts/e2e/stack-down.sh
#
# Honours FINERACT_IMAGE / POSTGRES_IMAGE / *_PASSWORD overrides (passed through
# to compose) and FINERACT_URL / WAIT_TRIES / WAIT_INTERVAL (readiness poll).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
COMPOSE_FILE="$ROOT/tools/api-automation/docker-compose.fineract.yml"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
else
  DC=(docker-compose)
fi

echo "[stack-up] booting the deployed container system (Postgres + Fineract) ..."
echo "[stack-up] compose file: $COMPOSE_FILE"
echo "[stack-up] image: ${FINERACT_IMAGE:-apache/fineract:latest}"
"${DC[@]}" -f "$COMPOSE_FILE" up -d

# Reuse the existing readiness poller (actuator health "UP").
FINERACT_URL="${FINERACT_URL:-https://127.0.0.1:8443}" \
WAIT_TRIES="${WAIT_TRIES:-90}" \
WAIT_INTERVAL="${WAIT_INTERVAL:-10}" \
  bash "$HERE/wait-fineract.sh"

echo "[stack-up] deployed container system is UP at ${FINERACT_URL:-https://127.0.0.1:8443}"
