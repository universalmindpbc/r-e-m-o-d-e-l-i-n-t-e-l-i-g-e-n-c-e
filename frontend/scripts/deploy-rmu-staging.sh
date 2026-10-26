#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_NODE_DIR="/Users/benkorbel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"

cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1 && [[ -x "$CODEX_NODE_DIR/node" ]]; then
  export PATH="$CODEX_NODE_DIR:$PATH"
fi

export WRANGLER_LOG_PATH="$PROJECT_DIR/.wrangler/wrangler.log"
export WRANGLER_WRITE_LOGS=false

./node_modules/.bin/eslint . --ignore-pattern dist --ignore-pattern .next
WRANGLER_LOG_PATH=.wrangler/wrangler.log ./node_modules/.bin/vinext build
./node_modules/.bin/wrangler deploy --config wrangler.rmu-staging.jsonc
