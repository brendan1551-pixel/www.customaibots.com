#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

DOTNET_TOOLS_DIR="$HOME/.dotnet/tools"

if ! command -v dotnet >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq dotnet-sdk-8.0
  fi
fi

if command -v dotnet >/dev/null 2>&1 && [ ! -x "$DOTNET_TOOLS_DIR/csharp-ls" ]; then
  # Pinned: newer versions ship a NuGet package missing DotnetToolSettings.xml and fail to install.
  dotnet tool install --global csharp-ls --version 0.15.0
fi

if [ -d "$DOTNET_TOOLS_DIR" ]; then
  echo "export PATH=\"\$PATH:$DOTNET_TOOLS_DIR\"" >> "$CLAUDE_ENV_FILE"
fi

export PATH="$PATH:$DOTNET_TOOLS_DIR"
command -v csharp-ls >/dev/null 2>&1 && csharp-ls --version || echo "csharp-ls installation failed" >&2
