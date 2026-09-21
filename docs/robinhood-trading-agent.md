# Robinhood Trading Agent (MCP)

This site registers a connection to a Robinhood trading agent exposed over the
[Model Context Protocol](https://modelcontextprotocol.io) at:

```
https://agent.robinhood.com/mcp/trading
```

The server configuration lives in [`mcp/config.json`](../mcp/config.json).

## What this integration does

An MCP-aware agent client (e.g. a chat assistant configured with this server)
can call tools exposed by this endpoint to:

- Read account balances, positions, and order history
- Place, modify, and cancel trade orders

## Safety model

This is a **live-trading** integration — actions taken through it can place
real orders with real money. To keep that safe:

- **No credentials in this repo.** Authentication is the account owner's own
  Robinhood OAuth session. This repository never stores API keys, tokens, or
  passwords.
- **Human confirmation required.** `mcp/config.json` sets
  `requireHumanConfirmation: true`. Any client wiring up this server should
  surface a confirmation step (showing symbol, side, quantity, and order
  type) before submitting an order — orders should never be placed
  autonomously without the account owner reviewing them first.
- **Least privilege.** If the endpoint supports scoped tokens (e.g.
  read-only vs. trading scopes), prefer read-only access unless order
  placement is explicitly needed.

## Setup

1. Authenticate with Robinhood through whatever OAuth flow
   `https://agent.robinhood.com/mcp/trading` documents for third-party
   clients. This site does not perform that authentication itself.
2. Point your MCP-compatible agent client at the server entry in
   `mcp/config.json`.
3. Confirm your client enforces a confirmation step before any order tool
   call is executed.

## Status

This repository currently ships the integration's configuration and
documentation. It does not include a hosted backend that proxies or executes
trades — that would require the account owner's live credentials and an
explicit decision about where such a service runs.
