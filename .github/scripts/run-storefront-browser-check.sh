#!/usr/bin/env bash
set -euo pipefail

case "${1:-}" in
  e2e|a11y) suite="$1" ;;
  *) echo "Expected e2e or a11y suite" >&2; exit 2 ;;
esac

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
set -a
source "$repo_root/.github/fixtures/storefront-browser.env"
set +a

cd "$repo_root"
npm run build
cd packages/storefront

if curl --fail --silent --show-error "$PREVIEW_URL/" > /dev/null 2>&1; then
  echo "Local browser test port is already serving a page" >&2
  exit 1
fi

node --env-file-if-exists=.env server.node.ts > server.log 2>&1 &
server_pid=$!
cleanup() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT

for attempt in {1..30}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "Local storefront exited before it became ready" >&2
    exit 1
  fi
  if curl --fail --silent --show-error "$PREVIEW_URL/" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl --fail --silent --show-error "$PREVIEW_URL/" > /dev/null
npm run "test:$suite"
