---
name: mcp-s-cli
description: Use when you need to interact with external tools, APIs, or data sources through MCP servers.
---

# mcp-s-cli

Access a single MCP server through the command line. MCP enables interaction with external systems like GitHub, filesystems, databases, and APIs.

## Commands

| Command                          | Output                                            |
| -------------------------------- | ------------------------------------------------- |
| `mcp-s-cli`                      | List all available tools                          |
| `mcp-s-cli info <tool>`          | Get tool JSON schema                              |
| `mcp-s-cli grep <query>`         | Search tools by name (case-insensitive substring) |
| `mcp-s-cli grep <query> -d`      | Search tools by name, include descriptions        |
| `mcp-s-cli get-servers`          | List available servers (slug, name, description) |
| `mcp-s-cli call <tool>`          | Call tool (reads JSON from stdin if no args)      |
| `mcp-s-cli call <tool> '<json>'` | Call tool with arguments                          |

## Auth Preflight

Before the first use of mcp-s-cli in a session, check auth state — this is instant (local file read, no network):

```bash
mcp-s-cli check-auth
```

- **Exit 0**: logged in and token is valid → you may proceed
- **Exit 4**: not logged in or token expired → run `mcp-s-cli login` before any other use of mcp-s-cli

## Workflow

1. **Discover**: find the right tool (see discovery ladder below)
2. **Inspect**: `mcp-s-cli info <tool>` → get full JSON schema
3. **Execute**: `mcp-s-cli call <tool> '<json>'` → run with arguments

## Cost-Aware Usage

Every command consumes tokens. Pick the cheapest operation that gets the job done.

### Discovery ladder (follow in order, stop as soon as you're confident)

1. **`grep <query>`** — cheapest. Guess a keyword from the user's request (e.g., "read a github file" → `grep file`). If the results clearly contain the right tool, skip to **Inspect**.
2. **`get-servers`** — lightweight REST call, returns each server's **slug**, name, and description. Use when grep results are ambiguous or empty and you need to understand which servers/domains are available.
3. **`grep <query>` scoped to a slug** — now that you know the relevant server slug(s), grep again to narrow results. If you're not confident you and still need more details, continue to step 4.
4. **`grep <query> -d`** — includes tool descriptions in the output. Use to disambiguate between similar-sounding candidates.

**Rule: always start with a plain `grep`. Escalate only when you're not confident you found the right tool.**

### Execution: keep responses small

- Use **filter/query parameters** to request only what's needed (e.g., Jira JQL, GitHub search queries, field selectors) instead of fetching everything.
- **Pipe output** through shell tools (`head`, `grep`, `jq`) to trim large responses before they enter context.
- Never fetch a full list when the user only needs a few fields (names, links, IDs).

### When a filter produces no output

When you pipe through a filter and get empty output, **do not** fall back to the raw unfiltered call. Use the **probe-then-filter** pattern:

1. **Probe**: fetch a _single_ item (e.g., `limit: 1`, or a dedicated get-one tool) without any pipe.
2. **Learn**: read the response to understand the actual field names, nesting, and types.
3. **Re-run**: call the bulk tool again with a corrected filter based on what you learned.

### Decision heuristic

- User mentions a specific tool or domain keyword → `grep` for it.
- Grep results are empty or ambiguous → `get-servers` to see available servers, then grep again with a better keyword or scoped to the relevant slug.
- You have candidates but can't tell them apart by name → `grep -d` for descriptions.
- User asks a broad question across all tools → `get-servers` first, then grep per relevant server.
- Task involves multiple items of the same type → use one bulk/list call, not N individual calls.
- Tool may return large payloads → use filter params + pipe to trim output.
- Filter script produced no output → **probe one item** to learn the shape, then re-run with a corrected filter. Never fall back to the raw unfiltered call.

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
mcp-s-cli grep file

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
