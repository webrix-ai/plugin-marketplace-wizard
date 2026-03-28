---
name: plugin-marketplace-builder
description: Build, validate, and deploy agent plugin marketplaces for Claude Code, Cursor, and GitHub Copilot. Use when creating plugins, scaffolding a marketplace, writing plugin manifests, configuring MCP servers within plugins, writing skills or agents for plugins, validating marketplace structure, deploying to a target platform, exploring what plugins to build, or understanding how plugin marketplaces work across platforms. Also triggers for "create a marketplace", "create a plugin", "add a plugin", "validate my marketplace", "deploy to cursor/claude/github", "what plugins should I create", "plugin manifest", "marketplace.json", or "plugin structure".
---

# Plugin Marketplace Builder

Build agent plugin marketplaces that ship to **Claude Code**, **Cursor**, and **GitHub Copilot**.

A plugin marketplace is a directory of plugins distributed as a git repository (or zip). Each platform reads a root `marketplace.json` manifest that lists available plugins. Each plugin bundles components: **MCP servers**, **skills**, **agents**, and optionally **hooks**.

## Marketplace Directory Layout

```
my-marketplace/
├── .claude-plugin/marketplace.json       # Claude Code catalog
├── .cursor-plugin/marketplace.json       # Cursor catalog
├── .github/plugin/marketplace.json       # GitHub Copilot catalog
└── plugins/
    └── <plugin-slug>/                    # one directory per plugin
        ├── .claude-plugin/plugin.json
        ├── .cursor-plugin/plugin.json
        ├── plugin.json                   # GitHub Copilot (root-level)
        ├── .mcp.json                     # MCP server definitions
        ├── skills/<name>/SKILL.md        # one dir per skill
        └── agents/<name>.md              # one file per agent
```

Not all targets are required. Include only the manifests for platforms you target.

## Root `marketplace.json`

All three platforms share the same schema (location differs):

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Team Name", "email": "team@example.com" },
  "metadata": { "description": "...", "version": "1.0.0" },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin",
      "description": "What this plugin does",
      "version": "1.0.0",
      "category": "productivity",
      "tags": ["mcp", "automation"]
    }
  ]
}
```

**Naming rules:** all names kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`), max 128 chars.

**Source field by platform:**

- Claude Code: `"./plugins/<slug>"` (relative path)
- Cursor: `"<slug>"` (bare slug)
- GitHub Copilot: `"./plugins/<slug>"` (relative path)

## Plugin Manifests (per-platform differences)

**Claude Code** (`.claude-plugin/plugin.json`):

```json
{
  "name": "slug",
  "description": "...",
  "version": "1.0.0",
  "author": { "name": "..." }
}
```

**Cursor** (`.cursor-plugin/plugin.json`):

```json
{
  "name": "slug",
  "displayName": "Human Name",
  "version": "1.0.0",
  "description": "...",
  "author": { "name": "..." }
}
```

**GitHub Copilot** (`plugin.json` at plugin root — not in a hidden folder):

```json
{
  "name": "slug",
  "description": "...",
  "version": "1.0.0",
  "skills": "skills/",
  "agents": "agents/",
  "mcpServers": ".mcp.json"
}
```

GitHub Copilot requires explicit component path references; the other two discover components implicitly.

## Plugin Components

### MCP Servers (`.mcp.json`)

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@org/mcp-server"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

Transport types: `stdio` (requires `command`), `sse` / `streamable-http` (requires `url` with `http(s)://`).

### Skills (`skills/<name>/SKILL.md`)

```markdown
---
name: skill-name
description: When and why to use this skill
---

Instructions for the agent...
```

Name: kebab-case, max 64 chars. Description: required, max 1024 chars. Each skill lives in its own subdirectory.

### Agents (`agents/<name>.md`)

Markdown files containing agent instructions. Name: kebab-case, max 64 chars.

### Hooks (platform-specific lifecycle handlers)

Claude Code: command, http, prompt, or agent handlers on events like PreToolUse, PostToolUse, Stop, SessionStart.
Cursor: command or prompt handlers on events like preToolUse, postToolUse, beforeShellExecution.

## Workflow

1. **Create** marketplace directory with root manifests and `plugins/` folder
2. **Add plugins** — create a subdirectory per plugin with manifests and components
3. **Validate** — run the bundled `validate-marketplace.sh` script or your own checks
4. **Deploy** — push to git and register with the target platform

## Validation

Run the bundled script (path relative to this skill directory):

```bash
bash <skill-dir>/scripts/validate-marketplace.sh /path/to/marketplace
bash <skill-dir>/scripts/validate-marketplace.sh /path/to/marketplace --verbose
```

Requires `python3` and `bash`. Checks: marketplace structure, manifest validity, kebab-case naming, required fields, MCP configs, skill files.

## Platform Deployment Guides

Read the platform-specific reference for deployment instructions:

- **Claude Code**: See [references/claude-code.md](references/claude-code.md) — CLI `/plugin marketplace add`, organization web console, team `.claude/settings.json` config
- **Cursor**: See [references/cursor.md](references/cursor.md) — Teams/Enterprise dashboard import, distribution policies
- **GitHub Copilot**: See [references/github-copilot.md](references/github-copilot.md) — CLI `copilot plugin marketplace add`, manifest differences

## Additional References

| File                                                       | Content                                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [references/schemas.md](references/schemas.md)             | Full manifest schemas, validation rules, all field definitions                                |
| [references/plugin-ideas.md](references/plugin-ideas.md)   | Plugin categories, starter ideas, marketplace organization patterns                           |
| [references/pmw-reference.md](references/pmw-reference.md) | Using Plugin Marketplace Wizard (visual editor + CLI tool) to accelerate marketplace creation |

## Pre-ship Checklist

- Root `marketplace.json` exists for each target platform in the correct location
- Each plugin directory under `plugins/` uses a kebab-case slug
- Each plugin has at least one platform manifest (`plugin.json`)
- MCP servers in `.mcp.json` with valid transport config (stdio needs `command`, remote needs `url`)
- Skills in `skills/<kebab-name>/SKILL.md` with `name` and `description` frontmatter
- Agents in `agents/<kebab-name>.md` with description
- All names kebab-case, no reserved or impersonation names
- Validation passes: `bash <skill-dir>/scripts/validate-marketplace.sh <marketplace-dir>`
