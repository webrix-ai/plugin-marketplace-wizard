# Cursor Plugin Marketplace

Everything needed to build and deploy plugins and marketplaces for Cursor.

## Table of Contents

- [Plugin Structure](#plugin-structure)
- [Marketplace Manifest](#marketplace-manifest)
- [Plugin Manifest](#plugin-manifest)
- [Component Layout](#component-layout)
- [Hook System](#hook-system)
- [Deployment](#deployment)
- [Local Testing](#local-testing)

---

## Plugin Structure

Cursor plugins follow a similar layout to Claude Code plugins:

```
my-plugin/
├── .cursor-plugin/
│   └── plugin.json          # Plugin manifest (required)
├── commands/                 # Slash commands (.md files)
├── agents/                   # Subagent definitions (.md files)
├── skills/                   # Skills (subdirectories with SKILL.md)
│   └── skill-name/
│       └── SKILL.md
├── .mcp.json                # MCP server definitions
└── scripts/                 # Helper scripts
```

## Marketplace Manifest

Location: `.cursor-plugin/marketplace.json`

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Team Name", "email": "team@example.com" },
  "metadata": { "description": "Plugin marketplace for my org", "version": "1.0.0" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "my-plugin",
      "description": "What this plugin does",
      "version": "1.0.0",
      "author": { "name": "Author" },
      "category": "productivity",
      "tags": ["automation"]
    }
  ]
}
```

**Source is a bare slug** (just the plugin name, not a path). This differs from Claude Code and GitHub Copilot.

## Plugin Manifest

Location: `.cursor-plugin/plugin.json` (inside each plugin directory)

```json
{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": { "name": "Author Name", "email": "author@example.com" }
}
```

Key difference from Claude Code: Cursor uses `displayName` for the human-readable name while `name` is the kebab-case slug.

## Component Layout

### Skills (`skills/<name>/SKILL.md`)

Same format as Claude Code:

```markdown
---
name: skill-name
description: When to apply this skill
---

Instructions for the agent...
```

### Agents (`agents/<name>.md`)

Markdown files with agent instructions and optional YAML frontmatter.

### MCP Servers (`.mcp.json`)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@org/mcp-server"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

## Hook System

Cursor hooks are configured in Cursor settings (not in `hooks.json` like Claude Code).

**Hook events (agent category):** sessionStart, sessionEnd, preToolUse, postToolUse, postToolUseFailure, subagentStart, subagentStop, beforeShellExecution, afterShellExecution, beforeMCPExecution, afterMCPExecution, beforeReadFile, afterFileEdit, beforeSubmitPrompt, preCompact, stop, afterAgentResponse, afterAgentThought

**Hook events (tab category):** beforeTabFileRead, afterTabFileEdit

**Handler types:** `command` (shell) or `prompt` (LLM prompt)

Hook fields: `event`, `category` (agent/tab), `type` (command/prompt), `command`/`prompt`, `matcher`, `timeout`, `loop_limit`, `failClosed`.

## Deployment

### Prerequisites

- Cursor **Teams** or **Enterprise** plan
- Admin access to Cursor organization dashboard
- Marketplace repository pushed to GitHub

### Import Marketplace

1. Cursor organization **Dashboard** → **Settings** → **Plugins**
2. Under **Team Marketplaces**, click **+ Import Marketplace**
3. Paste GitHub repository URL
4. Click **Continue** — Cursor parses `.cursor-plugin/marketplace.json`
5. Set **Team Access** distribution groups
6. Set marketplace name and description → **Save**

### Plugin Distribution

For each plugin, configure:

- **Required**: automatically installed for everyone in the distribution group
- **Optional**: available in the marketplace panel; developers choose to install

### Updating

Push changes to GitHub → click **Update** next to your marketplace in Plugins settings.

## Local Testing

Symlink a plugin for local testing before publishing:

```bash
ln -s /path/to/my-marketplace/plugins/my-plugin ~/.cursor/plugins/local/my-plugin
```

Restart Cursor or run **Developer: Reload Window**.

## Further Reading

- [Cursor Plugins documentation](https://cursor.com/docs/plugins)
- [Cursor Marketplace](https://cursor.com/marketplace)
