---
name: mcp-s-cli
description: Interface for MCP (Model Context Protocol) servers via CLI. Use when you need to interact with external tools, APIs, or data sources through MCP servers.
---

# mcp-s-cli

Access a single MCP server through the command line. MCP enables interaction with external systems like GitHub, filesystems, databases, and APIs.

## Commands

| Command                          | Output                                              |
| -------------------------------- | --------------------------------------------------- |
| `mcp-s-cli`                      | List all available tools                            |
| `mcp-s-cli info <tool>`          | Get tool JSON schema                                |
| `mcp-s-cli grep "<pattern>"`     | Search tools by name (names only, not descriptions) |
| `mcp-s-cli call <tool>`          | Call tool (reads JSON from stdin if no args)        |
| `mcp-s-cli call <tool> '<json>'` | Call tool with arguments                            |

## Workflow

1. **Discover**: `mcp-s-cli grep "<pattern>"` → find tools by keyword; fall back to `mcp-s-cli` only when you need a full inventory
2. **Inspect**: `mcp-s-cli info <tool>` → get full JSON schema
3. **Execute**: `mcp-s-cli call <tool> '<json>'` → run with arguments

## Cost-Aware Usage

Every command consumes tokens. Pick the cheapest operation that gets the job done.

### Discovery: start narrow

- **`grep "<pattern>"`** — cheapest. Use when you can guess a keyword from the user's request (e.g., "read a github file" → `grep "file"` or `grep "content"`).
- **`mcp-s-cli`** (names only) — moderate. Use when you need a full inventory (e.g., "what tools do I have?" or "analyze logs from all tools").
- **`mcp-s-cli -d`** (names + descriptions) — most expensive. Use only when names alone aren't enough to pick the right tool.

**Rule: if you can guess a keyword, grep first.**

### Execution: keep responses small

- Use **filter/query parameters** to request only what's needed (e.g., Jira JQL, GitHub search queries, field selectors) instead of fetching everything.
- **Pipe output** through shell tools (`head`, `grep`, `jq`) to trim large responses before they enter context.
- Never fetch a full list when the user only needs a few fields (names, links, IDs).

### Decision heuristic

- User mentions a specific tool or domain keyword → `grep` for it.
- User asks a broad question across all tools → list tools first, then act.
- Tool may return large payloads → use filter params + pipe to trim output.

## Examples

```bash
# List all tools
mcp-s-cli

# With descriptions
mcp-s-cli -d

# Get tool schema
mcp-s-cli info my-tool

# Call tool
mcp-s-cli call my-tool '{"arg-name": "arg-value"}'

# Pipe from stdin (no '-' needed!)
cat args.json | mcp-s-cli call my-tool

# Search for tools
mcp-s-cli grep "*file*"

# Output is raw text (pipe-friendly)
mcp-s-cli call read_file '{"path": "./file"}' | head -10
```

## Advanced Chaining

```bash
# Chain: search files → read first match
mcp-s-cli call search_files '{"path": ".", "pattern": "*.md"}' \
  | head -1 \
  | xargs -I {} mcp-s-cli call read_file '{"path": "{}"}'

# Loop: process multiple files
mcp-s-cli call list_directory '{"path": "./src"}' \
  | while read f; do mcp-s-cli call read_file "{\"path\": \"$f\"}"; done

# Save to file
mcp-s-cli call get_file_contents '{"owner": "x", "repo": "y", "path": "z"}' > output.txt
```

**Note:** `call` extracts text content from MCP responses and outputs it directly (no jq needed). Falls back to pretty-printed JSON when the response has no text parts.

## Common Errors

| Wrong Command               | Error              | Fix                                    |
| --------------------------- | ------------------ | -------------------------------------- |
| `mcp-s-cli run tool`        | UNKNOWN_SUBCOMMAND | Use `call` instead of `run`            |
| `mcp-s-cli call`            | MISSING_ARGUMENT   | Add tool name                          |
| `mcp-s-cli call tool {bad}` | INVALID_JSON       | Use valid JSON with quoted string keys |

## Debugging

Set `MCP_S_CLI_DEBUG=1` to enable verbose debug output to stderr.

## Exit Codes

- `0`: Success
- `1`: Client error (bad args, missing config)
- `2`: Server error (tool failed)
- `3`: Network error (connection failed)
- `4`: Auth error (authentication required)
