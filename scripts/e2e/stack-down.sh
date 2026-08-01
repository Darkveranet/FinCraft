#!/usr/bin/env bash
# scripts/e2e/stack-down.sh
#
# Tears down the deployed container system booted by scripts/e2e/stack-up.sh,
# exporting container logs first so CI can attach them as evidence. Safe to call
# unconditionally (e.g. in an `always()` step) — every step is best-effort.
#
#   scripts/e2e/stack-down.sh [log-file]
#
# log-file defaults to fineract-stack.log in the current directory.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
COMPOSE_FILE="$ROOT/tools/api-automation/docker-compose.fineract.yml"
LOG_FILE="${1:-fineract-stack.log}"

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
else
  DC=(docker-compose)
fi

echo "[stack-down] exporting container logs to $LOG_FILE"
"${DC[@]}" -f "$COMPOSE_FILE" logs --no-color > "$LOG_FILE" 2>&1 || true

echo "[stack-down] destroying the deployed container system (and its volume)"
"${DC[@]}" -f "$COMPOSE_FILE" down --volumes --remove-orphans || true

echo "[stack-down] done"
