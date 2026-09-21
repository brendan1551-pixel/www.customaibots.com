#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

APT_UPDATED=0
apt_update_once() {
  if [ "$APT_UPDATED" -eq 0 ] && command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    APT_UPDATED=1
  fi
}

# --- clangd (C/C++/Objective-C LSP) ---

if ! command -v clangd >/dev/null 2>&1; then
  apt_update_once
  apt-get install -y -qq clangd || apt-get install -y -qq clangd-18
fi

if ! command -v clangd >/dev/null 2>&1; then
  latest=$(ls /usr/bin/clangd-* 2>/dev/null | sort -V | tail -n1 || true)
  if [ -n "$latest" ]; then
    ln -sf "$latest" /usr/local/bin/clangd
  fi
fi

command -v clangd >/dev/null 2>&1 && clangd --version || echo "clangd installation failed" >&2

# --- csharp-ls (C# LSP) ---

DOTNET_TOOLS_DIR="$HOME/.dotnet/tools"

if ! command -v dotnet >/dev/null 2>&1; then
  apt_update_once
  apt-get install -y -qq dotnet-sdk-8.0
fi

if command -v dotnet >/dev/null 2>&1 && [ ! -x "$DOTNET_TOOLS_DIR/csharp-ls" ]; then
  # Pinned: newer versions ship a NuGet package missing DotnetToolSettings.xml and fail to install.
  dotnet tool install --global csharp-ls --version 0.15.0
fi

if [ -d "$DOTNET_TOOLS_DIR" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"\$PATH:$DOTNET_TOOLS_DIR\"" >> "$CLAUDE_ENV_FILE"
fi

export PATH="$PATH:$DOTNET_TOOLS_DIR"
command -v csharp-ls >/dev/null 2>&1 && csharp-ls --version || echo "csharp-ls installation failed" >&2
