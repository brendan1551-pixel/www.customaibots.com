#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v clangd >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq clangd || apt-get install -y -qq clangd-18
  fi
fi

if ! command -v clangd >/dev/null 2>&1; then
  latest=$(ls /usr/bin/clangd-* 2>/dev/null | sort -V | tail -n1 || true)
  if [ -n "$latest" ]; then
    ln -sf "$latest" /usr/local/bin/clangd
  fi
fi

command -v clangd >/dev/null 2>&1 && clangd --version || echo "clangd installation failed" >&2
