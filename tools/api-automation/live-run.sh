#!/usr/bin/env bash
# tools/api-automation/live-run.sh
#
# One-shot: stand up the deployed container system (Postgres + Fineract), wait
# for it to be healthy, run the contract-driven pipeline against the *live*
# instance (fetch-spec.mjs priority #2: FINERACT_BASE_URL), then tear it down.
#
# This is a thin wrapper around the SHARED stack helpers used by every test
# tier — scripts/e2e/stack-up.sh / stack-down.sh — so the API-automation live
# path, tests.yml and isolated-fineract-e2e.yml all boot the exact same stack
# from one script. There is no api-automation-specific compose/boot logic here.
#
# Usage:
#   ./live-run.sh                 # full pipeline against live Fineract
#   ./live-run.sh --generate      # pass-through flags to run.mjs
#   KEEP_UP=1 ./live-run.sh       # leave the stack running afterwards (debug)
#
# Env overrides (all optional, forwarded to the shared helpers / compose):
#   FINERACT_IMAGE, POSTGRES_IMAGE, POSTGRES_PASSWORD, FINERACT_DB_PASSWORD,
#   WAIT_TRIES, WAIT_INTERVAL.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
BASE_URL="${FINERACT_BASE_URL:-https://127.0.0.1:8443}"

cleanup() {
  if [ "${KEEP_UP:-0}" = "1" ]; then
    echo "[live-run] KEEP_UP=1 — leaving the stack running. Tear down later with:"
    echo "           bash \"$ROOT/scripts/e2e/stack-down.sh\""
    return
  fi
  echo "[live-run] tearing down the deployed container system ..."
  bash "$ROOT/scripts/e2e/stack-down.sh" "$HERE/fineract-live.log" || true
}
trap cleanup EXIT

echo "[live-run] booting the deployed container system via shared stack-up.sh ..."
# stack-up.sh boots the stack AND waits for actuator health "UP".
FINERACT_URL="$BASE_URL" bash "$ROOT/scripts/e2e/stack-up.sh"

echo "[live-run] running contract pipeline against live instance: $BASE_URL"
# NODE_TLS_REJECT_UNAUTHORIZED=0 because the disposable Fineract serves its own
# self-signed cert on :8443. Scope is this process only — it does not leak into
# the rest of your shell.
FINERACT_BASE_URL="$BASE_URL" \
NODE_TLS_REJECT_UNAUTHORIZED=0 \
  node "$HERE/run.mjs" "$@"

echo "[live-run] pipeline finished. Container logs saved to fineract-live.log on teardown."
