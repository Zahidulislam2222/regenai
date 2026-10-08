# Claude client setup

The service exposes five recommendation-only MCP tools. There is no tool for approving a refund or sending an email. The client receives the separate `ASSISTANT_MCP_TOKEN`; never provide the owner password or operator API bearer to an AI client.

Install the package in a private Python 3.12 environment. Create a private environment file containing only the service's public origin, base path and recommendation token. An HTTPS origin is required except for loopback development. Use the same variable names shown in `.env.example`; omit owner, provider, encryption and operator secrets from the client file.

In Claude Desktop Settings → Developer, open the configuration file. Preserve all existing servers and add a `regenai-support` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "regenai-support": {
      "command": "<absolute-path-to-regenai-assistant-mcp>",
      "args": ["--env-file", "<absolute-path-to-private-client-env>"]
    }
  }
}
```

The executable is created by the Python package installation. On Windows, use the environment's `Scripts` executable with correctly escaped JSON paths. Restart Claude Desktop, initialize the connection and inspect the listed tools. Verify a ticket read and a recommendation against prepared data. Install `SKILL.md` through the client's supported skill/custom-instruction mechanism and review `rulebook.example.json` before activation. The example intentionally authorizes zero refund reasons.

For Claude Code, register the same stdio command using its current MCP configuration interface. Do not overwrite the user's existing settings or perform a provider switch. The HTTP MCP endpoint also accepts the dedicated bearer for compatible clients, with stateless JSON responses. OAuth configuration of inboxes happens in the owner browser console, independently of the Claude client connection.

Troubleshooting: first verify service health and correct origin/token. Then check Desktop MCP logs, the Python environment path and environment-file permissions. The bridge sends protocol messages only on stdout and uses bounded requests without automatic retries. Keep tokens out of the Loom recording and client setup log.
